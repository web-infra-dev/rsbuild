import url from 'node:url';
import type {
  ServerAPIs,
  Middlewares,
  UpgradeEvent,
  RequestHandler,
  DevMiddlewaresConfig,
  CompileMiddlewareAPI,
} from '@rsbuild/shared';
import { isDebug } from '@rsbuild/shared';
import {
  faviconFallbackMiddleware,
  getHtmlFallbackMiddleware,
  getRequestLoggerMiddleware,
} from './middlewares';
import { join, isAbsolute } from 'node:path';

export type RsbuildDevMiddlewareOptions = {
  pwd: string;
  dev: DevMiddlewaresConfig;
  compileMiddlewareAPI?: CompileMiddlewareAPI;
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

  setupMiddlewares.forEach((handler) => {
    handler(
      {
        unshift: (...handlers) => before.unshift(...handlers),
        push: (...handlers) => after.push(...handlers),
      },
      serverOptions,
    );
  });

  return { before, after };
};

const applyDefaultMiddlewares = async ({
  middlewares,
  dev,
  compileMiddlewareAPI,
  output,
  pwd,
}: {
  output: RsbuildDevMiddlewareOptions['output'];
  pwd: RsbuildDevMiddlewareOptions['pwd'];
  middlewares: Middlewares;
  dev: RsbuildDevMiddlewareOptions['dev'];
  compileMiddlewareAPI?: CompileMiddlewareAPI;
}): Promise<{
  onUpgrade: UpgradeEvent;
}> => {
  const upgradeEvents: UpgradeEvent[] = [];
  // compression should be the first middleware
  if (dev.compress) {
    const { default: compression } = await import(
      '../../compiled/http-compression'
    );
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
    const confHeaders = dev.headers;
    if (confHeaders) {
      for (const [key, value] of Object.entries(confHeaders)) {
        res.setHeader(key, value);
      }
    }
    next();
  });

  // dev proxy handler, each proxy has own handler
  if (dev.proxy) {
    const { createProxyMiddleware } = await import('./proxy');
    const { middlewares: proxyMiddlewares, upgrade } = createProxyMiddleware(
      dev.proxy,
    );
    upgradeEvents.push(upgrade);
    proxyMiddlewares.forEach((middleware) => {
      middlewares.push(middleware);
    });
  }

  const { default: launchEditorMiddleware } = await import(
    '../../compiled/launch-editor-middleware'
  );
  middlewares.push(['/__open-in-editor', launchEditorMiddleware()]);

  if (compileMiddlewareAPI) {
    middlewares.push(compileMiddlewareAPI.middleware);

    // subscribe upgrade event to handle websocket
    upgradeEvents.push(
      compileMiddlewareAPI.onUpgrade.bind(compileMiddlewareAPI),
    );
  }

  if (dev.publicDir !== false && dev.publicDir?.name) {
    const { default: sirv } = await import('../../compiled/sirv');
    const { name } = dev.publicDir;
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
        htmlFallback: dev.htmlFallback,
      }),
    );

  if (dev.historyApiFallback) {
    const { default: connectHistoryApiFallback } = await import(
      '../../compiled/connect-history-api-fallback'
    );
    const historyApiFallbackMiddleware = connectHistoryApiFallback(
      dev.historyApiFallback === true ? {} : dev.historyApiFallback,
    ) as RequestHandler;

    middlewares.push(historyApiFallbackMiddleware);

    // ensure fallback request can be handled by webpack-dev-middleware
    compileMiddlewareAPI?.middleware &&
      middlewares.push(compileMiddlewareAPI.middleware);
  }

  middlewares.push(faviconFallbackMiddleware);

  return {
    onUpgrade: (...args) => {
      upgradeEvents.forEach((cb) => cb(...args));
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

  before.forEach((fn) => middlewares.push(fn));

  const { onUpgrade } = await applyDefaultMiddlewares({
    middlewares,
    dev: options.dev,
    compileMiddlewareAPI,
    output: options.output,
    pwd: options.pwd,
  });

  after.forEach((fn) => middlewares.push(fn));

  return {
    close: async () => {
      compileMiddlewareAPI?.close();
    },
    onUpgrade,
    middlewares,
  };
};
