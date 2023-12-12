import {
  CreateDevMiddlewareReturns,
  logger as defaultLogger,
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
  RsbuildDevMiddlewareOptions,
  Routes,
  DevServerAPI,
} from '@rsbuild/shared';
import type { Server } from 'http';
import connect from '@rsbuild/shared/connect';
import { registerCleaner } from './restart';
import type { Context } from '../types';
import { createHttpServer } from './httpServer';
import { getMiddlewares } from './devMiddlewares';

export async function createDevServer<
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
): Promise<DevServerAPI> {
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

  const { devMiddleware, compiler } = await createDevMiddleware(
    options,
    customCompiler,
  );

  const publicPaths = (compiler as RspackMultiCompiler).compilers
    ? (compiler as RspackMultiCompiler).compilers.map(getPublicPathFromCompiler)
    : [getPublicPathFromCompiler(compiler as RspackCompiler)];

  return {
    resolvedConfig: { devServerConfig, port, host, https, defaultRoutes },
    beforeStart: async () => {
      await options.context.hooks.onBeforeStartDevServerHook.call();
    },
    afterStart: async ({ port, routes }: { port: number; routes: Routes }) => {
      await options.context.hooks.onAfterStartDevServerHook.call({
        port,
        routes,
      });
    },
    getMiddlewares: async ({
      dev,
      app,
    }: {
      app: Server;
      dev: RsbuildDevMiddlewareOptions['dev'];
    }) =>
      await getMiddlewares(
        {
          pwd: options.context.rootPath,
          devMiddleware,
          dev,
          output: {
            distPath: rsbuildConfig.output?.distPath?.root || ROOT_DIST_DIR,
            publicPaths,
          },
        },
        app,
      ),
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

  const rsbuildServer = await createDevServer(options, createDevMiddleware, {
    compiler,
    printURLs,
    logger: customLogger,
    getPortSilently,
  });

  const {
    resolvedConfig: { devServerConfig, port, host, https, defaultRoutes },
  } = rsbuildServer;

  const logger = customLogger ?? defaultLogger;

  const middlewares = connect();

  const httpServer = await createHttpServer({
    https: devServerConfig.https,
    middlewares,
  });

  debug('create dev server done');

  await rsbuildServer.beforeStart();

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

  const devMiddlewares = await rsbuildServer.getMiddlewares({
    dev: devServerConfig,
    app: httpServer,
  });

  devMiddlewares.middlewares.forEach((m) => middlewares.use(m));

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

        debug('listen dev server done');

        await rsbuildServer.afterStart({
          port,
          routes: defaultRoutes,
        });

        const onClose = async () => {
          await devMiddlewares.close();
          httpServer.close();
        };

        registerCleaner(onClose);

        resolve({
          port,
          urls: urls.map((item) => item.url),
          server: {
            close: async () => {
              await onClose();
            },
          },
        });
      },
    );
  });
}
