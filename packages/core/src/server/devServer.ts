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
} from '@rsbuild/shared';
import connect from '@rsbuild/shared/connect';
import { registerCleaner } from './restart';
import type { Context } from '../types';
import { createHttpServer } from './httpServer';
import { getMiddlewares } from './devMiddlewares';

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
    compiler: customCompiler,
    printURLs = true,
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
    getPortSilently,
  });

  options.context.devServer = {
    hostname: host,
    port,
    https,
  };

  const protocol = https ? 'https' : 'http';
  let urls = getAddressUrls(protocol, port, host);
  const routes = formatRoutes(
    options.context.entry,
    rsbuildConfig.output?.distPath?.html,
    rsbuildConfig.html?.outputStructure,
  );

  debug('create dev server');

  const { devMiddleware, compiler } = await createDevMiddleware(
    options,
    customCompiler,
  );

  const publicPaths = (compiler as RspackMultiCompiler).compilers
    ? (compiler as RspackMultiCompiler).compilers.map(getPublicPathFromCompiler)
    : [getPublicPathFromCompiler(compiler as RspackCompiler)];

  const middlewares = connect();

  const httpServer = await createHttpServer({
    https: devServerConfig.https,
    middlewares,
  });

  debug('create dev server done');

  await options.context.hooks.onBeforeStartDevServerHook.call();

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

  const devMiddlewares = await getMiddlewares(
    {
      pwd: options.context.rootPath,
      devMiddleware,
      dev: devServerConfig,
      output: {
        distPath: rsbuildConfig.output?.distPath?.root || ROOT_DIST_DIR,
        publicPaths,
      },
    },
    httpServer,
  );

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

        await options.context.hooks.onAfterStartDevServerHook.call({
          port,
          routes,
        });

        const onClose = () => {
          devMiddlewares.close();
          httpServer.close();
        };

        registerCleaner(onClose);

        resolve({
          port,
          urls: urls.map((item) => item.url),
          server: {
            close: async () => {
              onClose();
            },
          },
        });
      },
    );
  });
}
