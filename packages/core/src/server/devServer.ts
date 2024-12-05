import fs from 'node:fs';
import type { Server } from 'node:http';
import type { Http2SecureServer } from 'node:http2';
import type Connect from '../../compiled/connect/index.js';
import { ROOT_DIST_DIR } from '../constants';
import { getPublicPathFromCompiler, isMultiCompiler } from '../helpers';
import { logger } from '../logger';
import type {
  CreateCompiler,
  CreateDevServerOptions,
  EnvironmentAPI,
  InternalContext,
  NormalizedConfig,
  NormalizedDevConfig,
  Rspack,
} from '../types';
import { isCliShortcutsEnabled, setupCliShortcuts } from './cliShortcuts';
import { CompilerDevMiddleware } from './compilerDevMiddleware';
import {
  createCacheableFunction,
  getTransformedHtml,
  loadBundle,
} from './environment';
import {
  type RsbuildDevMiddlewareOptions,
  getMiddlewares,
} from './getDevMiddlewares';
import {
  type StartServerResult,
  getAddressUrls,
  getRoutes,
  getServerConfig,
  getServerTerminator,
  printServerURLs,
} from './helper';
import { createHttpServer } from './httpServer';
import { notFoundMiddleware } from './middlewares';
import { open } from './open';
import { onBeforeRestartServer, restartDevServer } from './restart';
import { setupWatchFiles } from './watchFiles';

type HTTPServer = Server | Http2SecureServer;

export type RsbuildDevServer = {
  /**
   * Listen the Rsbuild server.
   * Do not call this method if you are using a custom server.
   */
  listen: () => Promise<{
    port: number;
    urls: string[];
    server: {
      close: () => Promise<void>;
    };
  }>;
  /**
   * Environment API of Rsbuild server.
   */
  environments: EnvironmentAPI;
  /**
   * The resolved port.
   * By default, Rsbuild server listens on port `3000` and automatically increments the port number if the port is occupied.
   */
  port: number;
  /**
   * The `connect` app instance.
   * Can be used to attach custom middlewares to the dev server.
   */
  middlewares: Connect.Server;
  /**
   * Notify that the Rsbuild server has been started.
   * Rsbuild will trigger `onAfterStartDevServer` hook in this stage.
   */
  afterListen: () => Promise<void>;
  /**
   * Activate socket connection.
   * This ensures that HMR works properly.
   */
  connectWebSocket: (options: { server: HTTPServer }) => void;
  /**
   * Close the Rsbuild server.
   */
  close: () => Promise<void>;
  /**
   * Print the server URLs.
   */
  printUrls: () => void;
  /**
   * Open URL in the browser after starting the server.
   */
  open: () => Promise<void>;
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
  createCompiler: CreateCompiler,
  config: NormalizedConfig,
  {
    compiler: customCompiler,
    getPortSilently,
    runCompile = true,
  }: CreateDevServerOptions = {},
): Promise<RsbuildDevServer> {
  logger.debug('create dev server');

  const { port, host, https, portTip } = await getServerConfig({
    config,
  });
  const devConfig = formatDevConfig(config.dev, port);

  const routes = getRoutes(options.context);

  options.context.devServer = {
    hostname: host,
    port,
    https,
  };

  // TODO: remove this type assertion after Rspack fix the type definition
  let outputFileSystem = fs as Rspack.OutputFileSystem;
  let lastStats: Rspack.Stats[];

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
    const compiler = customCompiler || (await createCompiler());

    if (!compiler) {
      throw new Error('[rsbuild:server] Failed to get compiler instance.');
    }

    const publicPaths = isMultiCompiler(compiler)
      ? compiler.compilers.map(getPublicPathFromCompiler)
      : [getPublicPathFromCompiler(compiler)];

    // create dev middleware instance
    const compilerDevMiddleware = new CompilerDevMiddleware({
      dev: devConfig,
      server: config.server,
      publicPaths: publicPaths,
      compiler,
      environments: options.context.environments,
    });

    await compilerDevMiddleware.init();

    // TODO: remove this type assertion after Rspack fix the type definition
    outputFileSystem =
      (isMultiCompiler(compiler)
        ? compiler.compilers[0].outputFileSystem
        : compiler.outputFileSystem) || (fs as Rspack.OutputFileSystem);

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

  const cliShortcutsEnabled = isCliShortcutsEnabled(devConfig);

  const printUrls = () =>
    printServerURLs({
      urls,
      port,
      routes,
      protocol,
      printUrls: config.server.printUrls,
      trailingLineBreak: !cliShortcutsEnabled,
    });

  const openPage = async () => {
    return open({
      https,
      port,
      routes,
      config,
      clearCache: true,
    });
  };

  const closeServer = async () => {
    await options.context.hooks.onCloseDevServer.call();
    await Promise.all([devMiddlewares.close(), fileWatcher?.close()]);
  };

  const beforeCreateCompiler = () => {
    printUrls();

    if (cliShortcutsEnabled) {
      const shortcutsOptions =
        typeof devConfig.cliShortcuts === 'boolean'
          ? {}
          : devConfig.cliShortcuts;

      setupCliShortcuts({
        openPage,
        closeServer,
        printUrls,
        restartServer: () => restartDevServer({ clear: false }),
        help: shortcutsOptions.help,
        customShortcuts: shortcutsOptions.custom,
      });
    }

    if (!getPortSilently && portTip) {
      logger.info(portTip);
    }
  };

  if (runCompile) {
    // print server url should between listen and beforeCompile
    options.context.hooks.onBeforeCreateCompiler.tap(beforeCreateCompiler);
  } else {
    beforeCreateCompiler();
  }

  const compileMiddlewareAPI = runCompile ? await startCompile() : undefined;

  const root = options.context.rootPath;

  const fileWatcher = await setupWatchFiles({
    dev: devConfig,
    server: config.server,
    compileMiddlewareAPI,
    root,
  });

  const readFileSync = (fileName: string) => {
    if ('readFileSync' in outputFileSystem) {
      // bundle require needs a synchronous method, although readFileSync is not within the outputFileSystem type definition, but nodejs fs API implemented.
      // @ts-expect-error
      return outputFileSystem.readFileSync(fileName, 'utf-8');
    }
    return fs.readFileSync(fileName, 'utf-8');
  };

  const cacheableLoadBundle = createCacheableFunction(loadBundle);
  const cacheableTransformedHtml = createCacheableFunction<string>(
    (_stats, entryName, utils) => getTransformedHtml(entryName, utils),
  );

  const environmentAPI = Object.fromEntries(
    Object.entries(options.context.environments).map(([name, environment]) => {
      return [
        name,
        {
          getStats: async () => {
            if (!runCompile) {
              throw new Error(
                '[rsbuild:server] Can not get stats info when "runCompile" is false',
              );
            }
            await waitFirstCompileDone;
            return lastStats[environment.index];
          },
          loadBundle: async <T>(entryName: string) => {
            await waitFirstCompileDone;
            return cacheableLoadBundle(
              lastStats[environment.index],
              entryName,
              {
                readFileSync,
                environment,
              },
            ) as T;
          },
          getTransformedHtml: async (entryName: string) => {
            await waitFirstCompileDone;
            return cacheableTransformedHtml(
              lastStats[environment.index],
              entryName,
              {
                readFileSync,
                environment,
              },
            );
          },
        },
      ];
    }),
  );

  const devMiddlewares = await getMiddlewares({
    pwd: root,
    compileMiddlewareAPI,
    dev: devConfig,
    server: config.server,
    environments: environmentAPI,
    output: {
      distPath: options.context.distPath || ROOT_DIST_DIR,
    },
    outputFileSystem,
  });

  const { default: connect } = await import('../../compiled/connect/index.js');
  const middlewares = connect();

  for (const item of devMiddlewares.middlewares) {
    if (Array.isArray(item)) {
      middlewares.use(...item);
    } else {
      middlewares.use(item);
    }
  }

  const devServerAPI: RsbuildDevServer = {
    port,
    middlewares,
    environments: environmentAPI,
    listen: async () => {
      const httpServer = await createHttpServer({
        serverConfig: config.server,
        middlewares,
      });

      const serverTerminator = getServerTerminator(httpServer);
      logger.debug('listen dev server');

      options.context.hooks.onCloseDevServer.tap(serverTerminator);

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

            await devServerAPI.afterListen();

            onBeforeRestartServer(devServerAPI.close);

            resolve({
              port,
              urls: urls.map((item) => item.url),
              server: {
                close: devServerAPI.close,
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
        environments: options.context.environments,
      });
    },
    connectWebSocket: ({ server }: { server: HTTPServer }) => {
      server.on('upgrade', devMiddlewares.onUpgrade);
    },
    close: closeServer,
    printUrls,
    open: openPage,
  };

  logger.debug('create dev server done');

  return devServerAPI;
}
