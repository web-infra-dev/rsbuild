import { isAbsolute, join } from 'node:path';
import { rspack } from '@rspack/core';
import { normalizePublicDirs } from '../defaultConfig';
import { castArray, pick } from '../helpers';
import { logger } from '../logger';
import type {
  DevConfig,
  InternalContext,
  RequestHandler,
  ServerConfig,
  SetupMiddlewaresServer,
} from '../types';
import type { CompilationManager } from './compilationManager';
import type { RsbuildDevServer } from './devServer';
import { gzipMiddleware } from './gzipMiddleware';
import type { UpgradeEvent } from './helper';
import {
  faviconFallbackMiddleware,
  getBaseMiddleware,
  getHtmlCompletionMiddleware,
  getHtmlFallbackMiddleware,
  getRequestLoggerMiddleware,
  viewingServedFilesMiddleware,
} from './middlewares';
import { replacePortPlaceholder } from './open';
import { createProxyMiddleware } from './proxy';

export type RsbuildDevMiddlewareOptions = {
  pwd: string;
  dev: DevConfig;
  devServerAPI: RsbuildDevServer;
  server: ServerConfig;
  context: InternalContext;
  compilationManager?: CompilationManager;
  /**
   * Callbacks returned by the `onBeforeStartDevServer` hook.
   */
  postCallbacks: (() => void)[];
};

const applySetupMiddlewares = (
  dev: RsbuildDevMiddlewareOptions['dev'],
  devServerAPI: RsbuildDevServer,
) => {
  const setupMiddlewares = dev.setupMiddlewares || [];

  const serverOptions: SetupMiddlewaresServer = pick(devServerAPI, [
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

export type Middlewares = Array<RequestHandler | [string, RequestHandler]>;

const applyDefaultMiddlewares = async ({
  dev,
  devServerAPI,
  middlewares,
  server,
  compilationManager,
  context,
  pwd,
  postCallbacks,
}: RsbuildDevMiddlewareOptions & {
  middlewares: Middlewares;
}): Promise<{
  onUpgrade: UpgradeEvent;
}> => {
  const upgradeEvents: UpgradeEvent[] = [];

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
  if (server.compress) {
    middlewares.push(gzipMiddleware());
  }

  // enable lazy compilation
  if (
    context.action === 'dev' &&
    context.bundlerType === 'rspack' &&
    dev.lazyCompilation &&
    compilationManager
  ) {
    const { compiler } = compilationManager;

    if (
      typeof dev.lazyCompilation === 'object' &&
      typeof dev.lazyCompilation.serverUrl === 'string' &&
      context.devServer
    ) {
      dev.lazyCompilation.serverUrl = replacePortPlaceholder(
        dev.lazyCompilation.serverUrl,
        context.devServer.port,
      );
    }

    middlewares.push(
      rspack.experiments.lazyCompilationMiddleware(compiler) as RequestHandler,
    );
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

  if (compilationManager) {
    middlewares.push(compilationManager.middleware);

    // subscribe upgrade event to handle websocket
    upgradeEvents.push(compilationManager.socketServer.upgrade);

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

  if (compilationManager) {
    middlewares.push(
      getHtmlCompletionMiddleware({
        compilationManager,
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

  if (compilationManager) {
    middlewares.push(
      getHtmlFallbackMiddleware({
        compilationManager,
        distPath: context.distPath,
        htmlFallback: server.htmlFallback,
      }),
    );
  }

  if (server.historyApiFallback) {
    const { default: connectHistoryApiFallback } = await import(
      '../../compiled/connect-history-api-fallback/index.js'
    );
    const historyApiFallbackMiddleware = connectHistoryApiFallback(
      server.historyApiFallback === true ? {} : server.historyApiFallback,
    ) as RequestHandler;

    middlewares.push(historyApiFallbackMiddleware);

    // ensure fallback request can be handled by compilation middleware
    if (compilationManager?.middleware) {
      middlewares.push(compilationManager.middleware);
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
  const { compilationManager } = options;

  if (logger.level === 'verbose') {
    middlewares.push(await getRequestLoggerMiddleware());
  }

  // Order: setupMiddlewares.unshift => internal middleware => setupMiddlewares.push
  const { before, after } = applySetupMiddlewares(
    options.dev,
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
      await compilationManager?.close();
    },
    onUpgrade,
    middlewares,
  };
};
