import { createServer, Server } from 'http';
import { createServer as createHttpsServer } from 'https';
import type { ListenOptions } from 'net';
import url from 'url';
import {
  DevConfig,
  ServerConfig,
  RequestHandler,
  ExposeServerApis,
  RsbuildDevServerOptions,
  CreateDevMiddlewareReturns,
  logger as defaultLogger,
  DevServerContext,
  StartDevServerOptions,
  getAddressUrls,
  printServerURLs,
  debug,
  isFunction,
  StartServerResult,
  getDevOptions,
  ROOT_DIST_DIR,
  formatRoutes,
  getPublicPathFromCompiler,
  RspackMultiCompiler,
  RspackCompiler,
} from '@rsbuild/shared';
import DevMiddleware from './dev-middleware';
import connect from '@rsbuild/shared/connect';
import { createProxyMiddleware } from './proxy';
import {
  faviconFallbackMiddleware,
  getHtmlFallbackMiddleware,
  notFoundMiddleware,
} from './middlewares';
import { join, isAbsolute } from 'path';
import { registerCleaner } from './restart';

export class RsbuildDevServer {
  private readonly dev: DevConfig & ServerConfig;
  private readonly devMiddleware: DevMiddleware;
  private pwd: string;
  private app!: Server;
  private output: RsbuildDevServerOptions['output'];
  public middlewares = connect();

  constructor(options: RsbuildDevServerOptions) {
    this.pwd = options.pwd;
    this.dev = options.dev;
    this.output = options.output;

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
      const { default: compression } = await import(
        '../../compiled/http-compression'
      );
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
      const { middlewares } = createProxyMiddleware(dev.proxy, app);
      middlewares.forEach((middleware) => {
        this.middlewares.use(middleware);
      });
    }

    // do webpack build / plugin apply / socket server when pass compiler instance
    devMiddleware.init(app);

    devMiddleware.middleware && this.middlewares.use(devMiddleware.middleware);

    const { distPath } = this.output;

    this.middlewares.use(
      getHtmlFallbackMiddleware({
        distPath: isAbsolute(distPath) ? distPath : join(this.pwd, distPath),
        publicPath: this.output.publicPath,
        callback: devMiddleware.middleware,
      }),
    );

    if (dev.historyApiFallback) {
      const { default: connectHistoryApiFallback } = await import(
        '../../compiled/connect-history-api-fallback'
      );

      const historyApiFallbackMiddleware = connectHistoryApiFallback(
        typeof dev.historyApiFallback === 'boolean'
          ? {}
          : dev.historyApiFallback,
      ) as RequestHandler;

      this.middlewares.use(historyApiFallbackMiddleware);

      devMiddleware.middleware &&
        this.middlewares.use(devMiddleware.middleware);
    }

    this.middlewares.use(faviconFallbackMiddleware);

    this.middlewares.use(notFoundMiddleware);
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
    this.devMiddleware.close();
    this.app.close();
  }
}

export async function startDevServer<
  Options extends {
    context: DevServerContext;
  },
>(
  options: Options,
  createDevMiddleware: (
    options: Options,
    compiler: StartDevServerOptions['compiler'],
  ) => Promise<CreateDevMiddlewareReturns>,
  {
    open,
    compiler: customCompiler,
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
  const routes = formatRoutes(
    options.context.entry,
    rsbuildConfig.output?.distPath?.html,
  );

  debug('create dev server');

  const { devMiddleware, compiler } = await createDevMiddleware(
    options,
    customCompiler,
  );

  const publicPath = (compiler as RspackMultiCompiler).compilers
    ? getPublicPathFromCompiler((compiler as RspackMultiCompiler).compilers[0])
    : getPublicPathFromCompiler(compiler as RspackCompiler);

  const server = new RsbuildDevServer({
    pwd: options.context.rootPath,
    devMiddleware,
    dev: devServerConfig,
    output: {
      distPath: rsbuildConfig.output?.distPath?.root || ROOT_DIST_DIR,
      publicPath,
    },
  });

  debug('create dev server done');

  await options.context.hooks.onBeforeStartDevServerHook.call();

  // TODO: support customApp
  const httpServer = await server.createHTTPServer();

  // print url after http server created and before dev compile (just a short time interval)
  if (printURLs) {
    if (isFunction(printURLs)) {
      urls = printURLs(urls);

      if (!Array.isArray(urls)) {
        throw new Error('Please return an array in the `printURLs` function.');
      }
    }

    printServerURLs(urls, routes, logger);
  }

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

        await options.context.hooks.onAfterStartDevServerHook.call({
          port,
          routes,
        });

        registerCleaner(() => server.close());

        resolve({
          port,
          urls: urls.map((item) => item.url),
          server: {
            close: async () => {
              server.close();
            },
          },
        });
      },
    );
  });
}
