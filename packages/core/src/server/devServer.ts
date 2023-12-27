import {
  debug,
  logger as defaultLogger,
  isFunction,
  ROOT_DIST_DIR,
  getAddressUrls,
  StartServerResult,
  getPublicPathFromCompiler,
  type Routes,
  type DevServerAPIs,
  type RspackCompiler,
  type RspackMultiCompiler,
  type CompileMiddlewareAPI,
  type DevMiddlewaresConfig,
  type StartDevServerOptions,
  type CreateDevMiddlewareReturns,
} from '@rsbuild/shared';
import { formatRoutes, getDevOptions, printServerURLs } from './helper';
import connect from '@rsbuild/shared/connect';
import { onBeforeRestartServer } from './restart';
import type { Context } from '../types';
import { createHttpServer } from './httpServer';
import { getMiddlewares } from './getDevMiddlewares';
import { notFoundMiddleware } from './middlewares';

export async function getServerAPIs<
  Options extends {
    context: Context;
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
  }: StartDevServerOptions & {
    defaultPort?: number;
  } = {},
): Promise<DevServerAPIs> {
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'development';
  }

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

  return {
    config: { devServerConfig, port, host, https, defaultRoutes },
    beforeStart: async () => {
      await options.context.hooks.onBeforeStartDevServerHook.call();
    },
    afterStart: async (params: { port?: number; routes?: Routes } = {}) => {
      await options.context.hooks.onAfterStartDevServerHook.call({
        port: params.port || port,
        routes: params.routes || defaultRoutes,
      });
    },
    startCompile: async () => {
      const { devMiddleware, compiler } = await createDevMiddleware(
        options,
        customCompiler,
      );
      const { CompilerDevMiddleware } = await import('./compilerDevMiddleware');

      const publicPaths = (compiler as RspackMultiCompiler).compilers
        ? (compiler as RspackMultiCompiler).compilers.map(
            getPublicPathFromCompiler,
          )
        : [getPublicPathFromCompiler(compiler as RspackCompiler)];

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
    },
    getMiddlewares: async (
      params: {
        compileMiddlewareAPI?: CompileMiddlewareAPI;
        /**
         * Overrides middleware configs
         *
         * By default, get config from rsbuild dev.xxx and server.xxx
         */
        overrides?: DevMiddlewaresConfig;
      } = {},
    ) => {
      const { compileMiddlewareAPI, overrides = {} } = params;

      return getMiddlewares({
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
    },
  };
}

export async function startDevServer<
  Options extends {
    context: Context;
  },
>(
  options: Options,
  createDevMiddleware: (
    options: Options,
    compiler: StartDevServerOptions['compiler'],
  ) => Promise<CreateDevMiddlewareReturns>,
  {
    compiler,
    printURLs = true,
    logger: customLogger,
    getPortSilently,
  }: StartDevServerOptions & {
    defaultPort?: number;
  } = {},
) {
  debug('create dev server');

  const serverAPIs = await getServerAPIs(options, createDevMiddleware, {
    compiler,
    printURLs,
    logger: customLogger,
    getPortSilently,
  });

  const {
    config: { devServerConfig, port, host, https, defaultRoutes },
  } = serverAPIs;

  const logger = customLogger ?? defaultLogger;

  const middlewares = connect();

  const httpServer = await createHttpServer({
    https: devServerConfig.https,
    middlewares,
  });

  debug('create dev server done');

  const protocol = https ? 'https' : 'http';
  let urls = getAddressUrls(protocol, port, host);

  // print url after http server created and before dev compile (just a short time interval)
  if (printURLs) {
    if (isFunction(printURLs)) {
      urls = printURLs(urls);

      if (!Array.isArray(urls)) {
        throw new Error('Please return an array in the `printURLs` function.');
      }
    }

    printServerURLs(urls, defaultRoutes, logger);
  }

  const compileMiddlewareAPI = await serverAPIs.startCompile();

  const devMiddlewares = await serverAPIs.getMiddlewares({
    compileMiddlewareAPI,
  });

  devMiddlewares.middlewares.forEach((m) => middlewares.use(m));

  middlewares.use(notFoundMiddleware);

  await serverAPIs.beforeStart();

  debug('listen dev server');

  httpServer.on('upgrade', devMiddlewares.onUpgrade);

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

        debug('listen dev server done');

        await serverAPIs.afterStart();

        const closeServer = async () => {
          await devMiddlewares.close();
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
}
