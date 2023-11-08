import { createServer, Server } from 'http';
import { createServer as createHttpsServer } from 'https';
import type { ListenOptions } from 'net';
import url from 'url';
import type {
  DevServerOptions,
  RequestHandler,
  ExposeServerApis,
  RsbuildDevServerOptions,
  CreateDevServerOptions,
  ServerApi,
} from './types';

import { getDefaultDevOptions } from './constants';
import DevMiddleware from './dev-middleware';
import { deepmerge as deepMerge } from '@rsbuild/shared/deepmerge';
import connect from 'connect';

export class RsbuildDevServer {
  private readonly dev: DevServerOptions;
  private readonly devMiddleware: DevMiddleware;
  private pwd: string;
  private app!: Server;
  public middlewares = connect();

  constructor(options: RsbuildDevServerOptions) {
    this.pwd = options.pwd;
    // set dev server options, like webpack-dev-server
    this.dev = this.getDevOptions(options);

    // create dev middleware instance
    this.devMiddleware = new DevMiddleware({
      dev: this.dev,
      devMiddleware: options.devMiddleware,
    });
  }

  private getDevOptions(options: RsbuildDevServerOptions) {
    const devOptions = typeof options.dev === 'boolean' ? {} : options.dev;
    const defaultOptions = getDefaultDevOptions();
    return deepMerge(defaultOptions, devOptions);
  }

  private applySetupMiddlewares() {
    const setupMiddlewares = this.dev.setupMiddlewares || [];

    const serverOptions: ExposeServerApis = {
      sockWrite: (type, data) => this.devMiddleware.sockWrite(type, data),
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
  }

  // Complete the preparation of services
  public async onInit(app: Server) {
    this.app = app;

    // Order: setupMiddlewares.unshift => internal middlewares => setupMiddlewares.push
    const { before, after } = this.applySetupMiddlewares();

    before.forEach((fn) => this.middlewares.use(fn));

    await this.applyDefaultMiddlewares(app);

    after.forEach((fn) => this.middlewares.use(fn));
  }

  private async applyDefaultMiddlewares(app: Server) {
    const { dev, devMiddleware } = this;

    // compression should be the first middleware
    if (dev.compress) {
      // @ts-expect-error http-compression does not provide a type definition
      const { default: compression } = await import('http-compression');
      this.middlewares.use((req, res, next) => {
        compression({
          gzip: true,
          brotli: false,
        })(req, res, next);
      });
    }

    this.middlewares.use((req, res, next) => {
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

    // TODO
    // dev proxy handler, each proxy has own handler
    // if (dev.proxy) {
    //   const { handlers, handleUpgrade } = createProxyHandler(dev.proxy);
    //   app && handleUpgrade(app);
    //   handlers.forEach((handler) => {
    //     this.addHandler(handler);
    //   });
    // }

    // do webpack build / plugin apply / socket server when pass compiler instance
    devMiddleware.init(app);

    devMiddleware.middleware && this.middlewares.use(devMiddleware.middleware);

    // TODO: add favicon fallback
    if (dev.historyApiFallback) {
      const { default: connectHistoryApiFallback } = await import(
        'connect-history-api-fallback'
      );

      const historyApiFallbackMiddleware = connectHistoryApiFallback(
        // @ts-expect-error
        typeof dev.historyApiFallback === 'boolean'
          ? {}
          : dev.historyApiFallback,
      ) as RequestHandler;

      this.middlewares.use(historyApiFallbackMiddleware);

      devMiddleware.middleware &&
        this.middlewares.use(devMiddleware.middleware);
    }
  }

  public async createHTTPServer() {
    const { dev } = this;
    const devHttpsOption = typeof dev === 'object' && dev.https;
    if (devHttpsOption) {
      const { genHttpsOptions } = require('./https');
      const httpsOptions = await genHttpsOptions(devHttpsOption, this.pwd);
      return createHttpsServer(httpsOptions, this.middlewares);
    } else {
      return createServer(this.middlewares);
    }
  }

  public listen(
    options?: number | ListenOptions | undefined,
    listener?: () => void,
  ) {
    const callback = () => {
      listener?.();
    };

    if (typeof options === 'object') {
      this.app.listen(options, callback);
    } else {
      this.app.listen(options || 8080, callback);
    }
  }

  public close() {
    this.app.close();
  }
}

export async function createDevServer(options: CreateDevServerOptions) {
  const { server: serverOptions = {}, ...devOptions } = options;

  // const resolvedConfig = await resolveConfig(devOptions, serverOptions);

  const devServer = new RsbuildDevServer(devOptions);

  const httpServer =
    serverOptions.customApp || (await devServer.createHTTPServer());

  const server: ServerApi = {
    middlewares: devServer.middlewares,
    init: async () => {
      await devServer.onInit(httpServer);
    },
    // resolvedConfig,
    listen: (options, cb) => {
      devServer.listen(options, cb);
    },
    close: () => {
      devServer.close();
    },
  };

  return server;
}
