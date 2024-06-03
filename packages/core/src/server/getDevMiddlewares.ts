import { isAbsolute, join } from 'node:path';
import url from 'node:url';
import type {
  DevConfig,
  RequestHandler,
  Rspack,
  ServerAPIs,
  ServerConfig,
} from '@rsbuild/shared';
import { isDebug } from '@rsbuild/shared';
import type { UpgradeEvent } from './helper';
import {
  faviconFallbackMiddleware,
  getHtmlFallbackMiddleware,
  getRequestLoggerMiddleware,
} from './middlewares';

export type CompileMiddlewareAPI = {
  middleware: RequestHandler;
  sockWrite: ServerAPIs['sockWrite'];
  onUpgrade: UpgradeEvent;
  close: () => void;
};

export type RsbuildDevMiddlewareOptions = {
  pwd: string;
  dev: DevConfig;
  server: ServerConfig;
  compileMiddlewareAPI?: CompileMiddlewareAPI;
  outputFileSystem: Rspack.OutputFileSystem;
  output: {
    distPath: string;
  };
};

const applySetupMiddlewares = (
  dev: RsbuildDevMiddlewareOptions['dev'],
  compileMiddlewareAPI?: CompileMiddlewareAPI,
) => {
  const setupMiddlewares = dev.setupMiddlewares || [];

  const serverOptions: ServerAPIs = {
    sockWrite: (type, data) => compileMiddlewareAPI?.sockWrite(type, data),
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
    const { default: compression } = await import('http-compression');
    middlewares.push((req, res, next) => {
      compression({
        gzip: true,
        brotli: false,
      })(req, res, next);
    });
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
    const { middlewares: proxyMiddlewares, upgrade } = createProxyMiddleware(
      server.proxy,
    );
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
      if (req.url?.endsWith('.hot-update.json')) {
        res.statusCode = 404;
        res.end();
      } else {
        next();
      }
    });
  }

  if (server.publicDir !== false && server.publicDir?.name) {
    const { default: sirv } = await import('sirv');
    const { name } = server.publicDir;
    const publicDir = isAbsolute(name) ? name : join(pwd, name);

    const assetMiddleware = sirv(publicDir, {
      etag: true,
      dev: true,
    });

    middlewares.push(assetMiddleware);
  }

  const { distPath } = output;

  compileMiddlewareAPI &&
    middlewares.push(
      getHtmlFallbackMiddleware({
        distPath: isAbsolute(distPath) ? distPath : join(pwd, distPath),
        callback: compileMiddlewareAPI.middleware,
        htmlFallback: server.htmlFallback,
        outputFileSystem,
      }),
    );

  if (server.historyApiFallback) {
    const { default: connectHistoryApiFallback } = await import(
      'connect-history-api-fallback'
    );
    const historyApiFallbackMiddleware = connectHistoryApiFallback(
      server.historyApiFallback === true ? {} : server.historyApiFallback,
    ) as RequestHandler;

    middlewares.push(historyApiFallbackMiddleware);

    // ensure fallback request can be handled by webpack-dev-middleware
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

export const getMiddlewares = async (options: RsbuildDevMiddlewareOptions) => {
  const middlewares: Middlewares = [];
  const { compileMiddlewareAPI } = options;

  if (isDebug()) {
    middlewares.push(await getRequestLoggerMiddleware());
  }

  // Order: setupMiddlewares.unshift => internal middlewares => setupMiddlewares.push
  const { before, after } = applySetupMiddlewares(
    options.dev,
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
