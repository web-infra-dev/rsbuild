import {
  debug,
  getNodeEnv,
  setNodeEnv,
  ROOT_DIST_DIR,
  getAddressUrls,
  isMultiCompiler,
  getPublicPathFromCompiler,
  type Routes,
  type RsbuildDevServer,
  type StartServerResult,
  type CreateDevServerOptions,
  type StartDevServerOptions,
  type CreateDevMiddlewareReturns,
} from '@rsbuild/shared';
import { formatRoutes, getDevOptions, printServerURLs } from './helper';
import connect from '@rsbuild/shared/connect';
import { onBeforeRestartServer } from './restart';
import type { InternalContext } from '../types';
import { createHttpServer } from './httpServer';
import {
  getMiddlewares,
  type RsbuildDevMiddlewareOptions,
} from './getDevMiddlewares';
import { notFoundMiddleware } from './middlewares';

export async function createDevServer<
  Options extends {
    context: InternalContext;
  },
>(
  options: Options,
  createDevMiddleware: (
    options: Options,
    compiler: StartDevServerOptions['compiler'],
  ) => Promise<CreateDevMiddlewareReturns>,
  {
    compiler: customCompiler,
    getPortSilently,
    runCompile = true,
    overrides = {},
  }: CreateDevServerOptions = {},
): Promise<RsbuildDevServer> {
  if (!getNodeEnv()) {
    setNodeEnv('development');
  }

  debug('create dev server');

  const rsbuildConfig = options.context.config;

  const { devServerConfig, port, host, https } = await getDevOptions({
    rsbuildConfig,
    getPortSilently,
  });

  const defaultRoutes = formatRoutes(
    options.context.entry,
    rsbuildConfig.output?.distPath?.html,
    rsbuildConfig.html?.outputStructure,
  );

  options.context.devServer = {
    hostname: host,
    port,
    https,
  };

  const startCompile: () => Promise<
    RsbuildDevMiddlewareOptions['compileMiddlewareAPI']
  > = async () => {
    const { devMiddleware, compiler } = await createDevMiddleware(
      options,
      customCompiler,
    );
    const { CompilerDevMiddleware } = await import('./compilerDevMiddleware');

    const publicPaths = isMultiCompiler(compiler)
      ? compiler.compilers.map(getPublicPathFromCompiler)
      : [getPublicPathFromCompiler(compiler)];

    // create dev middleware instance
    const compilerDevMiddleware = new CompilerDevMiddleware({
      dev: devServerConfig,
      publicPaths: publicPaths,
      devMiddleware,
    });

    compilerDevMiddleware.init();

    return {
      middleware: compilerDevMiddleware.middleware,
      sockWrite: (...args) => compilerDevMiddleware.sockWrite(...args),
      onUpgrade: (...args) => compilerDevMiddleware.upgrade(...args),
      close: () => compilerDevMiddleware?.close(),
    };
  };

  const protocol = https ? 'https' : 'http';
  const urls = getAddressUrls({ protocol, port, host });

  await options.context.hooks.onBeforeStartDevServer.call();

  if (runCompile) {
    options.context.hooks.onBeforeCreateCompiler.tap(() => {
      // print server url should between listen and beforeCompile
      printServerURLs({
        urls,
        port,
        routes: defaultRoutes,
        protocol,
        printUrls: devServerConfig.printUrls,
      });
    });
  } else {
    printServerURLs({
      urls,
      port,
      routes: defaultRoutes,
      protocol,
      printUrls: devServerConfig.printUrls,
    });
  }

  const compileMiddlewareAPI = runCompile ? await startCompile() : undefined;

  const devMiddlewares = await getMiddlewares({
    pwd: options.context.rootPath,
    compileMiddlewareAPI,
    dev: {
      ...devServerConfig,
      ...overrides,
    },
    output: {
      distPath: rsbuildConfig.output?.distPath?.root || ROOT_DIST_DIR,
    },
  });

  const server = {
    config: { devServerConfig, port, host, https, defaultRoutes },
    middlewares: devMiddlewares.middlewares,
    listen: async () => {
      const middlewares = connect();

      const httpServer = await createHttpServer({
        https: devServerConfig.https,
        middlewares,
      });
      debug('listen dev server');

      return new Promise<StartServerResult>((resolve) => {
        httpServer.listen(
          {
            host,
            port,
          },
          async (err?: Error) => {
            if (err) {
              throw err;
            }

            devMiddlewares.middlewares.forEach((item) => {
              if (Array.isArray(item)) {
                middlewares.use(...item);
              } else {
                middlewares.use(item);
              }
            });
            middlewares.use(notFoundMiddleware);

            httpServer.on('upgrade', devMiddlewares.onUpgrade);

            debug('listen dev server done');

            await server.afterListen();

            const closeServer = async () => {
              await server.close();
              httpServer.close();
            };

            onBeforeRestartServer(closeServer);

            resolve({
              port,
              urls: urls.map((item) => item.url),
              server: {
                close: closeServer,
              },
            });
          },
        );
      });
    },
    afterListen: async (params: { port?: number; routes?: Routes } = {}) => {
      await options.context.hooks.onAfterStartDevServer.call({
        port: params.port || port,
        routes: params.routes || defaultRoutes,
      });
    },
    onHTTPUpgrade: devMiddlewares.onUpgrade,
    close: async () => {
      await options.context.hooks.onCloseDevServer.call();
      await devMiddlewares.close();
    },
  };

  debug('create dev server done');

  return server;
}
