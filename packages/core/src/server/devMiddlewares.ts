import { Server } from 'http';
import url from 'url';
import {
  RequestHandler,
  ServerAPIs,
  RsbuildDevMiddlewareOptions,
} from '@rsbuild/shared';
import DevMiddleware from './compiler-dev-middleware';
import connect from '@rsbuild/shared/connect';
import {
  faviconFallbackMiddleware,
  getHtmlFallbackMiddleware,
  notFoundMiddleware,
} from './middlewares';
import { join, isAbsolute } from 'path';

const applySetupMiddlewares = (
  dev: RsbuildDevMiddlewareOptions['dev'],
  devMiddleware: DevMiddleware,
) => {
  const setupMiddlewares = dev.setupMiddlewares || [];

  const serverOptions: ServerAPIs = {
    sockWrite: (type, data) => devMiddleware.sockWrite(type, data),
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
  app,
  middlewares,
  dev,
  devMiddleware,
  output,
  pwd,
}: {
  output: RsbuildDevMiddlewareOptions['output'];
  pwd: RsbuildDevMiddlewareOptions['pwd'];
  app: Server;
  middlewares: connect.Server;
  dev: RsbuildDevMiddlewareOptions['dev'];
  devMiddleware: DevMiddleware;
}) => {
  // compression should be the first middleware
  if (dev.compress) {
    const { default: compression } = await import(
      '../../compiled/http-compression'
    );
    middlewares.use((req, res, next) => {
      compression({
        gzip: true,
        brotli: false,
      })(req, res, next);
    });
  }

  middlewares.use((req, res, next) => {
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
    const { middlewares: proxyMiddlewares } = createProxyMiddleware(
      dev.proxy,
      app,
    );
    proxyMiddlewares.forEach((middleware) => {
      middlewares.use(middleware);
    });
  }

  // do webpack build / plugin apply / socket server when pass compiler instance
  devMiddleware.init(app);

  devMiddleware.middleware && middlewares.use(devMiddleware.middleware);

  if (dev.publicDir && dev.publicDir.name) {
    const { default: sirv } = await import('../../compiled/sirv');
    const { name } = dev.publicDir;
    const publicDir = isAbsolute(name) ? name : join(pwd, name);

    const assetMiddleware = sirv(publicDir, {
      etag: true,
      dev: true,
    });

    middlewares.use(assetMiddleware);
  }

  const { distPath } = output;

  middlewares.use(
    getHtmlFallbackMiddleware({
      distPath: isAbsolute(distPath) ? distPath : join(pwd, distPath),
      callback: devMiddleware.middleware,
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

    middlewares.use(historyApiFallbackMiddleware);

    // ensure fallback request can be handled by webpack-dev-middleware
    devMiddleware.middleware && middlewares.use(devMiddleware.middleware);
  }

  middlewares.use(faviconFallbackMiddleware);
  middlewares.use(notFoundMiddleware);
};

export const initRsbuildDevMiddlewares = async (
  options: RsbuildDevMiddlewareOptions,
  app: Server,
  middlewares: connect.Server,
) => {
  // create dev middleware instance
  const devMiddleware = new DevMiddleware({
    dev: options.dev,
    publicPaths: options.output.publicPaths,
    devMiddleware: options.devMiddleware,
  });

  // Order: setupMiddlewares.unshift => internal middlewares => setupMiddlewares.push
  const { before, after } = applySetupMiddlewares(options.dev, devMiddleware);

  before.forEach((fn) => middlewares.use(fn));

  await applyDefaultMiddlewares({
    app,
    middlewares,
    dev: options.dev,
    devMiddleware,
    output: options.output,
    pwd: options.pwd,
  });

  after.forEach((fn) => middlewares.use(fn));

  return {
    close: () => {
      devMiddleware.close();
    },
  };
};
