import fs from 'node:fs';
import type {
  CreateDevServerOptions,
  EnvironmentAPI,
  Rspack,
  StartDevServerOptions,
  Stats,
} from '@rsbuild/shared';
import type Connect from 'connect';
import { ROOT_DIST_DIR } from '../constants';
import {
  getNodeEnv,
  getPublicPathFromCompiler,
  isMultiCompiler,
  setNodeEnv,
} from '../helpers';
import { logger } from '../logger';
import type { CreateDevMiddlewareReturns } from '../provider/createCompiler';
import type {
  InternalContext,
  NormalizedConfig,
  NormalizedDevConfig,
} from '../types';
import {
  type RsbuildDevMiddlewareOptions,
  getMiddlewares,
} from './getDevMiddlewares';
import {
  type StartServerResult,
  type UpgradeEvent,
  getAddressUrls,
  getRoutes,
  getServerConfig,
  printServerURLs,
} from './helper';
import { createHttpServer } from './httpServer';
import { notFoundMiddleware } from './middlewares';
import { onBeforeRestartServer } from './restart';
import { setupWatchFiles } from './watchFiles';

export type RsbuildDevServer = {
  /**
   * Use rsbuild inner server to listen
   */
  listen: () => Promise<{
    port: number;
    urls: string[];
    server: {
      close: () => Promise<void>;
    };
  }>;

  /** The following APIs will be used when you use a custom server */

  /** The Rsbuild server environment API */
  environments: EnvironmentAPI;

  /**
   * The resolved port.
   *
   * By default, Rsbuild Server listens on port `3000` and automatically increments the port number when the port is occupied.
   */
  port: number;
  /**
   * connect app instance.
   *
   * Can be used to attach custom middlewares to the dev server.
   */
  middlewares: Connect.Server;
  /**
   * Notify Rsbuild Server has started
   *
   * In Rsbuild, we will trigger onAfterStartDevServer hook in this stage
   */
  afterListen: () => Promise<void>;
  /**
   * Subscribe http upgrade event
   *
   * It will used when you use custom server
   */
  onHTTPUpgrade: UpgradeEvent;
  /**
   * Close the Rsbuild server.
   */
  close: () => Promise<void>;
};

const formatDevConfig = (config: NormalizedDevConfig, port: number) => {
  // replace port placeholder
  if (config.client.port === '<port>') {
    config.client.port = String(port);
  }
  return config;
};

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
  config: NormalizedConfig,
  {
    compiler: customCompiler,
    getPortSilently,
    runCompile = true,
  }: CreateDevServerOptions = {},
): Promise<RsbuildDevServer> {
  if (!getNodeEnv()) {
    setNodeEnv('development');
  }

  logger.debug('create dev server');

  const { port, host, https } = await getServerConfig({
    config,
    getPortSilently,
  });
  const devConfig = formatDevConfig(config.dev, port);

  const routes = getRoutes(options.context);

  options.context.devServer = {
    hostname: host,
    port,
    https,
  };

  let outputFileSystem: Rspack.OutputFileSystem = fs;

  let lastStats: Stats[];

  // should register onDevCompileDone hook before startCompile
  const waitFirstCompileDone = runCompile
    ? new Promise<void>((resolve) => {
        options.context.hooks.onDevCompileDone.tap(
          ({ stats, isFirstCompile }) => {
            lastStats = 'stats' in stats ? stats.stats : [stats];

            if (!isFirstCompile) {
              return;
            }
            resolve();
          },
        );
      })
    : Promise.resolve();

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
      dev: devConfig,
      server: config.server,
      publicPaths: publicPaths,
      devMiddleware,
    });

    await compilerDevMiddleware.init();

    outputFileSystem =
      (isMultiCompiler(compiler)
        ? compiler.compilers[0].outputFileSystem
        : compiler.outputFileSystem) || fs;

    return {
      middleware: compilerDevMiddleware.middleware,
      sockWrite: (...args) => compilerDevMiddleware.sockWrite(...args),
      onUpgrade: (...args) => compilerDevMiddleware.upgrade(...args),
      close: () => compilerDevMiddleware?.close(),
    };
  };

  const protocol = https ? 'https' : 'http';
  const urls = getAddressUrls({ protocol, port, host });

  await options.context.hooks.onBeforeStartDevServer.call({
    environments: options.context.environments,
  });

  if (runCompile) {
    options.context.hooks.onBeforeCreateCompiler.tap(() => {
      // print server url should between listen and beforeCompile
      printServerURLs({
        urls,
        port,
        routes,
        protocol,
        printUrls: config.server.printUrls,
      });
    });
  } else {
    printServerURLs({
      urls,
      port,
      routes,
      protocol,
      printUrls: config.server.printUrls,
    });
  }

  const compileMiddlewareAPI = runCompile ? await startCompile() : undefined;

  const fileWatcher = await setupWatchFiles({
    dev: devConfig,
    server: config.server,
    compileMiddlewareAPI,
  });

  const environmentAPI = Object.fromEntries(
    Object.keys(options.context.environments).map((name, index) => {
      return [
        name,
        {
          getStats: async () => {
            if (!runCompile) {
              throw new Error("can't get stats info when runCompile is false");
            }
            await waitFirstCompileDone;
            return lastStats[index];
          },
        },
      ];
    }),
  );

  const devMiddlewares = await getMiddlewares({
    pwd: options.context.rootPath,
    compileMiddlewareAPI,
    dev: devConfig,
    server: config.server,
    environments: environmentAPI,
    output: {
      distPath: options.context.distPath || ROOT_DIST_DIR,
    },
    outputFileSystem,
  });

  const { default: connect } = await import('connect');
  const middlewares = connect();

  for (const item of devMiddlewares.middlewares) {
    if (Array.isArray(item)) {
      middlewares.use(...item);
    } else {
      middlewares.use(item);
    }
  }

  const server = {
    port,
    middlewares,
    outputFileSystem,
    environments: environmentAPI,
    listen: async () => {
      const httpServer = await createHttpServer({
        serverConfig: config.server,
        middlewares,
      });
      logger.debug('listen dev server');

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

            middlewares.use(notFoundMiddleware);

            httpServer.on('upgrade', devMiddlewares.onUpgrade);

            logger.debug('listen dev server done');

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
    afterListen: async () => {
      await options.context.hooks.onAfterStartDevServer.call({
        port,
        routes,
      });
    },
    onHTTPUpgrade: devMiddlewares.onUpgrade,
    close: async () => {
      await options.context.hooks.onCloseDevServer.call();
      await devMiddlewares.close();
      await fileWatcher?.close();
    },
  };

  logger.debug('create dev server done');

  return server;
}
