import {
  debug,
  getNodeEnv,
  setNodeEnv,
  ROOT_DIST_DIR,
  getAddressUrls,
  getPublicPathFromCompiler,
  type Routes,
  type DevServerAPIs,
  type RspackCompiler,
  type StartServerResult,
  type RspackMultiCompiler,
  type CompileMiddlewareAPI,
  type DevMiddlewaresConfig,
  type StartDevServerOptions,
  type CreateDevMiddlewareReturns,
} from '@rsbuild/shared';
import { formatRoutes, getDevOptions, printServerURLs } from './helper';
import connect from '@rsbuild/shared/connect';
import { onBeforeRestartServer } from './restart';
import type { InternalContext } from '../types';
import { createHttpServer } from './httpServer';
import { getMiddlewares } from './getDevMiddlewares';
import { notFoundMiddleware } from './middlewares';

export async function getServerAPIs<
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
  }: StartDevServerOptions & {
    defaultPort?: number;
  } = {},
): Promise<DevServerAPIs> {
  if (!getNodeEnv()) {
    setNodeEnv('development');
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
      await options.context.hooks.onBeforeStartDevServer.call();
    },
    afterStart: async (params: { port?: number; routes?: Routes } = {}) => {
      await options.context.hooks.onAfterStartDevServer.call({
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
    context: InternalContext;
  },
>(
  options: Options,
  createDevMiddleware: (
    options: Options,
    compiler: StartDevServerOptions['compiler'],
  ) => Promise<CreateDevMiddlewareReturns>,
  {
    compiler,
    getPortSilently,
  }: StartDevServerOptions & {
    defaultPort?: number;
  } = {},
) {
  debug('create dev server');

  const serverAPIs = await getServerAPIs(options, createDevMiddleware, {
    compiler,
    getPortSilently,
  });

  const {
    config: { devServerConfig, port, host, https, defaultRoutes },
  } = serverAPIs;

  const middlewares = connect();

  const httpServer = await createHttpServer({
    https: devServerConfig.https,
    middlewares,
  });

  debug('create dev server done');

  const protocol = https ? 'https' : 'http';
  const urls = getAddressUrls({ protocol, port, host });

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

  await serverAPIs.beforeStart();

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

        const compileMiddlewareAPI = await serverAPIs.startCompile();

        const devMiddlewares = await serverAPIs.getMiddlewares({
          compileMiddlewareAPI,
        });

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

        await serverAPIs.afterStart();

        const closeServer = async () => {
          await options.context.hooks.onCloseDevServer.call();
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
