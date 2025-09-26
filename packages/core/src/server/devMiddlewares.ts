import { isAbsolute, join } from 'node:path';
import { normalizePublicDirs } from '../defaultConfig';
import { castArray, isMultiCompiler, pick } from '../helpers';
import { logger } from '../logger';
import { rspack } from '../rspack';
import type {
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
  getBaseMiddleware,
  getHtmlCompletionMiddleware,
  getHtmlFallbackMiddleware,
  getRequestLoggerMiddleware,
  viewingServedFilesMiddleware,
} from './middlewares';
import { createProxyMiddleware } from './proxy';

export type RsbuildDevMiddlewareOptions = {
  config: NormalizedConfig;
  context: InternalContext;
  buildManager?: BuildManager;
  devServerAPI: RsbuildDevServer;
  /**
   * Callbacks returned by the `onBeforeStartDevServer` hook.
   */
  postCallbacks: (() => void)[];
  pwd: string;
};

const applySetupMiddlewares = (
  config: NormalizedConfig,
  devServerAPI: RsbuildDevServer,
) => {
  const setupMiddlewares = config.dev.setupMiddlewares || [];

  const serverOptions: SetupMiddlewaresContext = pick(devServerAPI, [
    'sockWrite',
    'environments',
  ]);

  const before: RequestHandler[] = [];
  const after: RequestHandler[] = [];

  for (const handler of castArray(setupMiddlewares)) {
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

export type Middlewares = (RequestHandler | [string, RequestHandler])[];

const applyDefaultMiddlewares = async ({
  config,
  buildManager,
  context,
  devServerAPI,
  middlewares,
  pwd,
  postCallbacks,
}: RsbuildDevMiddlewareOptions & {
  middlewares: Middlewares;
}): Promise<{
  onUpgrade: UpgradeEvent;
}> => {
  const upgradeEvents: UpgradeEvent[] = [];
  const { server } = config;

  if (server.cors) {
    const { default: corsMiddleware } = await import(
      '../../compiled/cors/index.js'
    );
    middlewares.push(
      corsMiddleware(typeof server.cors === 'boolean' ? {} : server.cors),
    );
  }

  // apply `server.headers` option
  // `server.headers` can override `server.cors`
  const { headers } = server;
  if (headers) {
    middlewares.push((_req, res, next) => {
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
      middlewares.push(middleware);
    }
  }

  // compression is placed after proxy middleware to avoid breaking SSE (Server-Sent Events),
  // but before other middleware to ensure responses are properly compressed
  const { compress } = server;
  if (compress) {
    middlewares.push(
      gzipMiddleware(typeof compress === 'object' ? compress : undefined),
    );
  }

  // enable lazy compilation
  if (
    context.action === 'dev' &&
    context.bundlerType === 'rspack' &&
    buildManager
  ) {
    const { compiler } = buildManager;

    // We check the compiler options to determine whether lazy compilation is enabled.
    // Rsbuild users can enable lazy compilation in two ways:
    // 1. Use Rsbuild's `dev.lazyCompilation` option
    // 2. Use Rspack's `experiments.lazyCompilation` option
    // 3. Use Rspack's configuration top-level `lazyCompilation` option
    const isLazyCompilationEnabled = () => {
      if (isMultiCompiler(compiler)) {
        return compiler.compilers.some(
          (childCompiler) =>
            childCompiler.options.experiments?.lazyCompilation ||
            childCompiler.options.lazyCompilation,
        );
      }
      return (
        compiler.options.experiments?.lazyCompilation ||
        compiler.options.lazyCompilation
      );
    };

    if (isLazyCompilationEnabled()) {
      middlewares.push(
        rspack.experiments.lazyCompilationMiddleware(
          compiler,
        ) as RequestHandler,
      );
    }
  }

  if (server.base && server.base !== '/') {
    middlewares.push(getBaseMiddleware({ base: server.base }));
  }

  const { default: launchEditorMiddleware } = await import(
    '../../compiled/launch-editor-middleware/index.js'
  );
  middlewares.push(['/__open-in-editor', launchEditorMiddleware()]);

  middlewares.push(
    viewingServedFilesMiddleware({
      environments: devServerAPI.environments,
    }),
  );

  if (buildManager) {
    middlewares.push(buildManager.middleware);

    // subscribe upgrade event to handle websocket
    upgradeEvents.push(buildManager.socketServer.upgrade);

    middlewares.push((req, res, next) => {
      // [prevFullHash].hot-update.json will 404 (expected) when rsbuild restart and some file changed
      if (req.url?.endsWith('.hot-update.json') && req.method !== 'OPTIONS') {
        res.statusCode = 404;
        res.end();
      } else {
        next();
      }
    });
  }

  if (buildManager) {
    middlewares.push(
      getHtmlCompletionMiddleware({
        buildManager,
        distPath: context.distPath,
      }),
    );
  }

  const publicDirs = normalizePublicDirs(server?.publicDir);
  for (const publicDir of publicDirs) {
    const { default: sirv } = await import('../../compiled/sirv/index.js');
    const { name } = publicDir;
    const normalizedPath = isAbsolute(name) ? name : join(pwd, name);

    const assetMiddleware = sirv(normalizedPath, {
      etag: true,
      dev: true,
    });

    middlewares.push(assetMiddleware);
  }

  // Execute callbacks returned by the `onBeforeStartDevServer` hook.
  // This is the ideal place for users to add custom middleware because:
  // 1. It runs after most of the default middleware
  // 2. It runs before fallback middleware
  // This ensures custom middleware can intercept requests before any fallback handling
  for (const callback of postCallbacks) {
    callback();
  }

  if (buildManager) {
    middlewares.push(
      getHtmlFallbackMiddleware({
        buildManager,
        distPath: context.distPath,
        htmlFallback: server.htmlFallback,
      }),
    );
  }

  if (server.historyApiFallback) {
    middlewares.push(
      historyApiFallbackMiddleware(
        server.historyApiFallback === true ? {} : server.historyApiFallback,
      ),
    );

    // ensure fallback request can be handled by compilation middleware
    if (buildManager?.middleware) {
      middlewares.push(buildManager.middleware);
    }
  }

  middlewares.push(faviconFallbackMiddleware);

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
  middlewares: Middlewares;
};

export const getDevMiddlewares = async (
  options: RsbuildDevMiddlewareOptions,
): Promise<GetDevMiddlewaresResult> => {
  const middlewares: Middlewares = [];
  const { buildManager } = options;

  if (logger.level === 'verbose') {
    middlewares.push(getRequestLoggerMiddleware());
  }

  // Order: setupMiddlewares.unshift => internal middleware => setupMiddlewares.push
  const { before, after } = applySetupMiddlewares(
    options.config,
    options.devServerAPI,
  );

  middlewares.push(...before);

  const { onUpgrade } = await applyDefaultMiddlewares({
    ...options,
    middlewares,
  });

  middlewares.push(...after);

  return {
    close: async () => {
      await buildManager?.close();
    },
    onUpgrade,
    middlewares,
  };
};
