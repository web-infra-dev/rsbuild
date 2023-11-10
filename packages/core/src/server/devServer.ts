import { createServer, Server } from 'http';
import { createServer as createHttpsServer } from 'https';
import type { ListenOptions } from 'net';
import url from 'url';
import {
  DevServerOptions,
  RequestHandler,
  ExposeServerApis,
  RsbuildDevServerOptions,
  CreateDevServerOptions,
  logger as defaultLogger,
  DevServerContext,
  StartDevServerOptions,
  getAddressUrls,
  printServerURLs,
  debug,
  isFunction,
  StartServerResult,
  getDevOptions,
} from '@rsbuild/shared';
import { getDefaultDevOptions } from './constants';
import DevMiddleware from './dev-middleware';
import { deepmerge } from '@rsbuild/shared/deepmerge';
import connect from 'connect';
import { createProxyMiddleware } from './proxy';
import { faviconFallbackMiddleware } from './middlewares';

export class RsbuildDevServer {
  private readonly dev: DevServerOptions;
  private readonly devMiddleware: DevMiddleware;
  private pwd: string;
  private app!: Server;
  public middlewares = connect();

  constructor(options: RsbuildDevServerOptions) {
    this.pwd = options.pwd;
    // set dev server options, like webpack-dev-server
    this.dev = deepmerge(getDefaultDevOptions(), options.dev);

    // create dev middleware instance
    this.devMiddleware = new DevMiddleware({
      dev: this.dev,
      devMiddleware: options.devMiddleware,
    });
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

    // dev proxy handler, each proxy has own handler
    if (dev.proxy) {
      const { middlewares, handleUpgrade } = createProxyMiddleware(dev.proxy);
      app && handleUpgrade(app);
      middlewares.forEach((middleware) => {
        this.middlewares.use(middleware);
      });
    }

    // do webpack build / plugin apply / socket server when pass compiler instance
    devMiddleware.init(app);

    devMiddleware.middleware && this.middlewares.use(devMiddleware.middleware);

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

    this.middlewares.use(faviconFallbackMiddleware);
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
    listener?: (err?: Error) => Promise<void>,
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

export async function startDevServer<
  Options extends {
    context: DevServerContext;
  },
>(
  options: Options,
  startDevCompile: (
    options: Options,
    compiler: StartDevServerOptions['compiler'],
  ) => Promise<CreateDevServerOptions['devMiddleware']>,
  {
    open,
    compiler,
    printURLs = true,
    strictPort = false,
    logger: customLogger,
    getPortSilently,
  }: StartDevServerOptions & {
    defaultPort?: number;
  } = {},
) {
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'development';
  }

  const rsbuildConfig = options.context.config;
  const logger = customLogger ?? defaultLogger;
  const { devServerConfig, port, host, https } = await getDevOptions({
    rsbuildConfig,
    strictPort,
    getPortSilently,
  });

  options.context.devServer = {
    hostname: host,
    port,
    https,
    open,
  };

  const protocol = https ? 'https' : 'http';
  let urls = getAddressUrls(protocol, port, rsbuildConfig.dev?.host);

  if (printURLs) {
    if (isFunction(printURLs)) {
      urls = printURLs(urls);

      if (!Array.isArray(urls)) {
        throw new Error('Please return an array in the `printURLs` function.');
      }
    }

    printServerURLs(urls, logger);
  }

  debug('create dev server');

  // TODO: reorder
  const devMiddleware = await startDevCompile(options, compiler);

  const server = new RsbuildDevServer({
    pwd: options.context.rootPath,
    devMiddleware,
    dev: devServerConfig,
  });

  debug('create dev server done');

  await options.context.hooks.onBeforeStartDevServerHook.call();

  // TODO: support customApp
  const httpServer = await server.createHTTPServer();

  await server.onInit(httpServer);

  debug('listen dev server');

  return new Promise<StartServerResult>((resolve) => {
    server.listen(
      {
        host,
        port,
      },
      async (err?: Error) => {
        if (err) {
          throw err;
        }

        debug('listen dev server done');

        await options.context.hooks.onAfterStartDevServerHook.call({ port });
        resolve({
          port,
          urls: urls.map((item) => item.url),
          server: {
            close: () => {
              server.close();
            },
          },
        });
      },
    );
  });
}
