import { isAbsolute, join } from 'node:path';
import url from 'node:url';
import { normalizePublicDirs } from '../config';
import { logger } from '../logger';
import type {
  DevConfig,
  EnvironmentAPI,
  RequestHandler,
  Rspack,
  ServerConfig,
  SetupMiddlewaresServer,
} from '../types';
import type { UpgradeEvent } from './helper';
import {
  faviconFallbackMiddleware,
  getHtmlCompletionMiddleware,
  getHtmlFallbackMiddleware,
  getRequestLoggerMiddleware,
} from './middlewares';

export type CompileMiddlewareAPI = {
  middleware: RequestHandler;
  sockWrite: SetupMiddlewaresServer['sockWrite'];
  onUpgrade: UpgradeEvent;
  close: () => void;
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
}: RsbuildDevMiddlewareOptions & {
  middlewares: Middlewares;
}): Promise<{
  onUpgrade: UpgradeEvent;
}> => {
  const upgradeEvents: UpgradeEvent[] = [];
  // compression should be the first middleware
  if (server.compress) {
    const { gzipMiddleware } = await import('./gzipMiddleware');
    middlewares.push(gzipMiddleware());
  }

  middlewares.push((req, res, next) => {
    // allow hmr request cross-domain, because the user may use global proxy
    res.setHeader('Access-Control-Allow-Origin', '*');
    const path = req.url ? url.parse(req.url).pathname : '';
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

  // dev proxy handler, each proxy has own handler
  if (server.proxy) {
    const { createProxyMiddleware } = await import('./proxy');
    const { middlewares: proxyMiddlewares, upgrade } =
      await createProxyMiddleware(server.proxy);
    upgradeEvents.push(upgrade);

    for (const middleware of proxyMiddlewares) {
      middlewares.push(middleware);
    }
  }

  const { default: launchEditorMiddleware } = await import(
    'launch-editor-middleware'
  );
  middlewares.push(['/__open-in-editor', launchEditorMiddleware()]);

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
    const { default: sirv } = await import('sirv');
    const { name } = publicDir;
    const normalizedPath = isAbsolute(name) ? name : join(pwd, name);

    const assetMiddleware = sirv(normalizedPath, {
      etag: true,
      dev: true,
    });

    middlewares.push(assetMiddleware);
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
      'connect-history-api-fallback'
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

  // OPTIONS request fallback middleware
  // Should register this middleware as the last
  // see: https://github.com/web-infra-dev/rsbuild/pull/2867
  middlewares.push((req, res, next) => {
    if (req.method === 'OPTIONS') {
      // Use 204 as no content to send in the response body
      res.statusCode = 204;
      res.setHeader('Content-Length', '0');
      res.end();
      return;
    }
    next();
  });

  return {
    onUpgrade: (...args) => {
      for (const cb of upgradeEvents) {
        cb(...args);
      }
    },
  };
};

export const getMiddlewares = async (
  options: RsbuildDevMiddlewareOptions,
): Promise<{
  close: () => Promise<void>;
  onUpgrade: UpgradeEvent;
  middlewares: Middlewares;
}> => {
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
      compileMiddlewareAPI?.close();
    },
    onUpgrade,
    middlewares,
  };
};
