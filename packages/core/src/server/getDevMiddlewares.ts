import { isAbsolute, join } from 'node:path';
import { normalizePublicDirs } from '../config';
import { parseUrl } from '../helpers';
import { logger } from '../logger';
import type {
  DevConfig,
  EnvironmentAPI,
  RequestHandler,
  Rspack,
  ServerConfig,
  SetupMiddlewaresServer,
} from '../types';
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
import { createProxyMiddleware } from './proxy';

export type CompileMiddlewareAPI = {
  middleware: RequestHandler;
  sockWrite: SetupMiddlewaresServer['sockWrite'];
  onUpgrade: UpgradeEvent;
  close: () => Promise<void>;
};

export type RsbuildDevMiddlewareOptions = {
  pwd: string;
  dev: DevConfig;
  server: ServerConfig;
  environments: EnvironmentAPI;
  compileMiddlewareAPI?: CompileMiddlewareAPI;
  outputFileSystem: Rspack.OutputFileSystem;
  output: {
    distPath: string;
  };
  /**
   * Callbacks returned by the `onBeforeStartDevServer` hook.
   */
  postCallbacks: (() => void)[];
};

const applySetupMiddlewares = (
  dev: RsbuildDevMiddlewareOptions['dev'],
  environments: EnvironmentAPI,
  compileMiddlewareAPI?: CompileMiddlewareAPI,
) => {
  const setupMiddlewares = dev.setupMiddlewares || [];

  const serverOptions: SetupMiddlewaresServer = {
    sockWrite: (type, data) => compileMiddlewareAPI?.sockWrite(type, data),
    environments,
  };

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

export type Middlewares = Array<RequestHandler | [string, RequestHandler]>;

const applyDefaultMiddlewares = async ({
  middlewares,
  server,
  compileMiddlewareAPI,
  output,
  pwd,
  outputFileSystem,
  environments,
  postCallbacks,
}: RsbuildDevMiddlewareOptions & {
  middlewares: Middlewares;
}): Promise<{
  onUpgrade: UpgradeEvent;
}> => {
  const upgradeEvents: UpgradeEvent[] = [];
  // compression should be the first middleware
  if (server.compress) {
    middlewares.push(gzipMiddleware());
  }

  middlewares.push((req, res, next) => {
    // allow HMR request cross-domain, because the user may use global proxy
    res.setHeader('Access-Control-Allow-Origin', '*');
    const path = req.url ? parseUrl(req.url)?.pathname : '';
    if (path?.includes('hot-update')) {
      res.setHeader('Access-Control-Allow-Credentials', 'false');
    }

    // The headers configured by the user on devServer will not take effect on html requests. Add the following code to make the configured headers take effect on all requests.
    const confHeaders = server.headers;
    if (confHeaders) {
      for (const [key, value] of Object.entries(confHeaders)) {
        res.setHeader(key, value);
      }
    }
    next();
  });

  if (server.cors) {
    const { default: corsMiddleware } = await import(
      '../../compiled/cors/index.js'
    );
    middlewares.push(
      corsMiddleware(typeof server.cors === 'boolean' ? {} : server.cors),
    );
  }

  // dev proxy handler, each proxy has own handler
  if (server.proxy) {
    const { middlewares: proxyMiddlewares, upgrade } =
      await createProxyMiddleware(server.proxy);
    upgradeEvents.push(upgrade);

    for (const middleware of proxyMiddlewares) {
      middlewares.push(middleware);
    }
  }

  if (server.base && server.base !== '/') {
    middlewares.push(getBaseMiddleware({ base: server.base }));
  }

  const { default: launchEditorMiddleware } = await import(
    '../../compiled/launch-editor-middleware/index.js'
  );
  middlewares.push(['/__open-in-editor', launchEditorMiddleware()]);

  middlewares.push(viewingServedFilesMiddleware({ environments }));

  if (compileMiddlewareAPI) {
    middlewares.push(compileMiddlewareAPI.middleware);

    // subscribe upgrade event to handle websocket
    upgradeEvents.push(
      compileMiddlewareAPI.onUpgrade.bind(compileMiddlewareAPI),
    );

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

  const distPath = isAbsolute(output.distPath)
    ? output.distPath
    : join(pwd, output.distPath);

  if (compileMiddlewareAPI) {
    middlewares.push(
      getHtmlCompletionMiddleware({
        distPath,
        callback: compileMiddlewareAPI.middleware,
        outputFileSystem,
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
  // This is the ideal place for users to add custom middlewares because:
  // 1. It runs after most of the default middlewares
  // 2. It runs before fallback middlewares
  // This ensures custom middleware can intercept requests before any fallback handling
  for (const callback of postCallbacks) {
    callback();
  }

  if (compileMiddlewareAPI) {
    middlewares.push(
      getHtmlFallbackMiddleware({
        distPath,
        callback: compileMiddlewareAPI.middleware,
        htmlFallback: server.htmlFallback,
        outputFileSystem,
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

    // ensure fallback request can be handled by rsbuild-dev-middleware
    compileMiddlewareAPI?.middleware &&
      middlewares.push(compileMiddlewareAPI.middleware);
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

export type GetMiddlewaresResult = {
  close: () => Promise<void>;
  onUpgrade: UpgradeEvent;
  middlewares: Middlewares;
};

export const getMiddlewares = async (
  options: RsbuildDevMiddlewareOptions,
): Promise<GetMiddlewaresResult> => {
  const middlewares: Middlewares = [];
  const { environments, compileMiddlewareAPI } = options;

  if (logger.level === 'verbose') {
    middlewares.push(await getRequestLoggerMiddleware());
  }

  // Order: setupMiddlewares.unshift => internal middlewares => setupMiddlewares.push
  const { before, after } = applySetupMiddlewares(
    options.dev,
    environments,
    compileMiddlewareAPI,
  );

  middlewares.push(...before);

  const { onUpgrade } = await applyDefaultMiddlewares({
    ...options,
    middlewares,
  });

  middlewares.push(...after);

  return {
    close: async () => {
      await compileMiddlewareAPI?.close();
    },
    onUpgrade,
    middlewares,
  };
};
