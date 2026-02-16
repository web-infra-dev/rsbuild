import { rspack } from '@rspack/core';
import { castArray, pick } from '../helpers';
import { isMultiCompiler } from '../helpers/compiler';
import { isVerbose } from '../logger';
import type {
  Connect,
  InternalContext,
  NormalizedConfig,
  RequestHandler,
  SetupMiddlewaresContext,
} from '../types';
import type { BuildManager } from './buildManager';
import type { RsbuildDevServer } from './devServer';
import { gzipMiddleware } from './gzipMiddleware';
import type { UpgradeEvent } from './helper';
import { historyApiFallbackMiddleware } from './historyApiFallback';
import {
  faviconFallbackMiddleware,
  getBaseUrlMiddleware,
  getHtmlCompletionMiddleware,
  getHtmlFallbackMiddleware,
  getRequestLoggerMiddleware,
  notFoundMiddleware,
  viewingServedFilesMiddleware,
} from './middlewares';
import { createProxyMiddleware } from './proxy';

export type RsbuildDevMiddlewareOptions = {
  config: NormalizedConfig;
  context: InternalContext;
  buildManager?: BuildManager;
  devServerAPI: RsbuildDevServer;
  /**
   * Callbacks returned by `onBeforeStartDevServer` hook and `server.setup` config
   */
  postCallbacks: (() => Promise<void> | void)[];
};

const applySetupMiddlewares = (
  config: NormalizedConfig,
  devServerAPI: RsbuildDevServer,
) => {
  const setupMiddlewares = config.dev.setupMiddlewares
    ? castArray(config.dev.setupMiddlewares)
    : [];
  const serverOptions: SetupMiddlewaresContext = pick(devServerAPI, [
    'sockWrite',
    'environments',
  ]);

  const before: RequestHandler[] = [];
  const after: RequestHandler[] = [];

  for (const handler of setupMiddlewares) {
    handler(
      {
        unshift: (...handlers) => before.unshift(...handlers),
        push: (...handlers) => after.push(...handlers),
      },
      serverOptions,
    );
  }

  return { before, after };
};

const applyDefaultMiddlewares = async ({
  config,
  buildManager,
  context,
  devServerAPI,
  middlewares,
  postCallbacks,
}: RsbuildDevMiddlewareOptions & {
  middlewares: Connect.Server;
}): Promise<{
  onUpgrade: UpgradeEvent;
}> => {
  const upgradeEvents: UpgradeEvent[] = [];
  const { server } = config;

  if (server.cors) {
    const { default: corsMiddleware } = await import(
      /* webpackChunkName: "cors" */ 'cors'
    );
    middlewares.use(
      corsMiddleware(typeof server.cors === 'boolean' ? {} : server.cors),
    );
  }

  // apply `server.headers` option
  // `server.headers` can override `server.cors`
  const { headers } = server;
  if (headers) {
    middlewares.use((_req, res, next) => {
      for (const [key, value] of Object.entries(headers)) {
        res.setHeader(key, value);
      }
      next();
    });
  }

  // Apply proxy middleware
  // each proxy configuration creates its own middleware instance
  if (server.proxy) {
    const { middlewares: proxyMiddlewares, upgrade } =
      await createProxyMiddleware(server.proxy);
    upgradeEvents.push(upgrade);

    for (const middleware of proxyMiddlewares) {
      middlewares.use(middleware);
    }
  }

  // compression is placed after proxy middleware to avoid breaking SSE (Server-Sent Events),
  // but before other middleware to ensure responses are properly compressed
  const { compress } = server;
  if (compress) {
    middlewares.use(
      gzipMiddleware(typeof compress === 'object' ? compress : undefined),
    );
  }

  // enable lazy compilation
  if (context.action === 'dev' && buildManager) {
    const { compiler } = buildManager;

    // We check the compiler options to determine whether lazy compilation is enabled.
    // Rsbuild users can enable lazy compilation in two ways:
    // 1. Use Rsbuild's `dev.lazyCompilation` option
    // 2. Use Rspack's configuration top-level `lazyCompilation` option
    const isLazyCompilationEnabled = () => {
      if (isMultiCompiler(compiler)) {
        return compiler.compilers.some(
          (childCompiler) => childCompiler.options.lazyCompilation,
        );
      }
      return compiler.options.lazyCompilation;
    };

    if (isLazyCompilationEnabled()) {
      middlewares.use(
        rspack.lazyCompilationMiddleware(compiler) as RequestHandler,
      );
    }
  }

  if (server.base && server.base !== '/') {
    middlewares.use(getBaseUrlMiddleware({ base: server.base }));
  }

  const { default: launchEditorMiddleware } = await import(
    /* webpackChunkName: "launch-editor-middleware" */
    // @ts-ignore launch-editor-middleware has no types
    'launch-editor-middleware'
  );
  middlewares.use('/__open-in-editor', launchEditorMiddleware());

  middlewares.use(
    viewingServedFilesMiddleware({
      environments: devServerAPI.environments,
    }),
  );

  if (buildManager) {
    middlewares.use(buildManager.assetsMiddleware);

    // subscribe upgrade event to handle websocket
    upgradeEvents.push(buildManager.socketServer.upgrade);

    middlewares.use(function hotUpdateJsonFallbackMiddleware(req, res, next) {
      // [prevFullHash].hot-update.json will 404 (expected) when rsbuild restart and some file changed
      if (req.url?.endsWith('.hot-update.json') && req.method !== 'OPTIONS') {
        notFoundMiddleware(req, res, next);
      } else {
        next();
      }
    });
  }

  if (buildManager) {
    middlewares.use(
      getHtmlCompletionMiddleware({
        buildManager,
        distPath: context.distPath,
      }),
    );
  }

  if (server.publicDir.length) {
    const { default: sirv } = await import(
      /* webpackChunkName: "sirv" */ 'sirv'
    );
    for (const { name } of server.publicDir) {
      const sirvMiddleware = sirv(name, {
        etag: true,
        dev: true,
      });
      middlewares.use(function publicDirMiddleware(req, res, next) {
        sirvMiddleware(req, res, next);
      });
    }
  }

  // Execute callbacks returned by the `onBeforeStartDevServer` hook and `server.setup` config.
  // This is the ideal place for users to add custom middleware because:
  // 1. It runs after most of the default middleware
  // 2. It runs before fallback middleware
  // This ensures custom middleware can intercept requests before any fallback handling
  for (const callback of postCallbacks) {
    await callback();
  }

  // historyApiFallback takes precedence over the default htmlFallback.
  if (server.historyApiFallback) {
    middlewares.use(
      historyApiFallbackMiddleware(
        server.historyApiFallback === true ? {} : server.historyApiFallback,
      ),
    );

    // ensure fallback request can be handled by compilation middleware
    if (buildManager?.assetsMiddleware) {
      middlewares.use(buildManager.assetsMiddleware);
    }
  }

  if (buildManager) {
    middlewares.use(
      getHtmlFallbackMiddleware({
        buildManager,
        distPath: context.distPath,
        htmlFallback: server.htmlFallback,
      }),
    );
  }

  middlewares.use(faviconFallbackMiddleware);

  return {
    onUpgrade: (...args) => {
      for (const cb of upgradeEvents) {
        cb(...args);
      }
    },
  };
};

export type GetDevMiddlewaresResult = {
  close: () => Promise<void>;
  onUpgrade: UpgradeEvent;
};

export const getDevMiddlewares = async (
  options: RsbuildDevMiddlewareOptions,
): Promise<GetDevMiddlewaresResult> => {
  const { buildManager, devServerAPI } = options;
  const { middlewares } = devServerAPI;

  if (isVerbose()) {
    middlewares.use(getRequestLoggerMiddleware());
  }

  // Order: setupMiddlewares.unshift => internal middleware => setupMiddlewares.push
  const { before, after } = applySetupMiddlewares(
    options.config,
    options.devServerAPI,
  );

  for (const middleware of before) {
    middlewares.use(middleware);
  }

  const { onUpgrade } = await applyDefaultMiddlewares({
    ...options,
    middlewares,
  });

  for (const middleware of after) {
    middlewares.use(middleware);
  }

  return {
    close: async () => {
      await buildManager?.close();
    },
    onUpgrade,
  };
};
