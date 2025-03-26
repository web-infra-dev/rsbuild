import type { Server } from 'node:http';
import type { Http2SecureServer } from 'node:http2';
import type Connect from '../../compiled/connect/index.js';
import { ROOT_DIST_DIR } from '../constants';
import { getPublicPathFromCompiler, isMultiCompiler } from '../helpers';
import { logger } from '../logger';
import { onBeforeRestartServer, restartDevServer } from '../restart';
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
import { CompilationManager } from './compilationManager';
import {
  type GetDevMiddlewaresResult,
  getDevMiddlewares,
} from './devMiddlewares';
import {
  createCacheableFunction,
  getTransformedHtml,
  loadBundle,
} from './environment';
import {
  registerCleanup,
  removeCleanup,
  setupGracefulShutdown,
} from './gracefulShutdown';
import {
  type StartServerResult,
  getAddressUrls,
  getRoutes,
  getServerConfig,
  getServerTerminator,
  printServerURLs,
} from './helper';
import { createHttpServer } from './httpServer';
import { notFoundMiddleware, optionsFallbackMiddleware } from './middlewares';
import { open } from './open';
import { type WatchFilesResult, setupWatchFiles } from './watchFiles';

type HTTPServer = Server | Http2SecureServer;

export type RsbuildDevServer = {
  /**
   * The `connect` app instance.
   * Can be used to attach custom middlewares to the dev server.
   */
  middlewares: Connect.Server;
  /**
   * The Node.js HTTP server instance.
   * - Will be `Http2SecureServer` if `server.https` config is used.
   * - Will be `null` if `server.middlewareMode` is enabled.
   */
  httpServer:
    | import('node:http').Server
    | import('node:http2').Http2SecureServer
    | null;
  /**
   * Start listening on the Rsbuild dev server.
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
  const { middlewareMode } = config.server;
  const devConfig = formatDevConfig(config.dev, port);
  const routes = getRoutes(options.context);
  const root = options.context.rootPath;

  options.context.devServer = {
    hostname: host,
    port,
    https,
  };

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

  const startCompile: () => Promise<CompilationManager> = async () => {
    const compiler = customCompiler || (await createCompiler());

    if (!compiler) {
      throw new Error('[rsbuild:server] Failed to get compiler instance.');
    }

    const publicPaths = isMultiCompiler(compiler)
      ? compiler.compilers.map(getPublicPathFromCompiler)
      : [getPublicPathFromCompiler(compiler)];

    // create dev middleware instance
    const compilationManager = new CompilationManager({
      dev: devConfig,
      server: {
        ...config.server,
        port,
      },
      publicPaths: publicPaths,
      compiler,
      environments: options.context.environments,
    });

    await compilationManager.init();

    return compilationManager;
  };

  const protocol = https ? 'https' : 'http';
  const urls = getAddressUrls({ protocol, port, host });

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

  // biome-ignore lint/style/useConst: should be declared before use
  let fileWatcher: WatchFilesResult | undefined;
  let devMiddlewares: GetDevMiddlewaresResult | undefined;

  const cleanupGracefulShutdown = middlewareMode
    ? null
    : setupGracefulShutdown();

  const closeServer = async () => {
    // ensure closeServer is only called once
    removeCleanup(closeServer);
    cleanupGracefulShutdown?.();
    await options.context.hooks.onCloseDevServer.callBatch();
    await Promise.all([devMiddlewares?.close(), fileWatcher?.close()]);
  };

  if (!middlewareMode) {
    registerCleanup(closeServer);
  }

  const beforeCreateCompiler = () => {
    printUrls();

    if (cliShortcutsEnabled) {
      const shortcutsOptions =
        typeof devConfig.cliShortcuts === 'boolean'
          ? {}
          : devConfig.cliShortcuts;

      const cleanup = setupCliShortcuts({
        openPage,
        closeServer,
        printUrls,
        restartServer: () => restartDevServer({ clear: false }),
        help: shortcutsOptions.help,
        customShortcuts: shortcutsOptions.custom,
      });
      options.context.hooks.onCloseDevServer.tap(cleanup);
    }

    if (!getPortSilently && portTip) {
      logger.info(portTip);
    }
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
            if (!compilationManager) {
              throw new Error(
                '[rsbuild:server] Can not get stats info when "runCompile" is false',
              );
            }
            await waitFirstCompileDone;
            return lastStats[environment.index];
          },
          loadBundle: async <T>(entryName: string) => {
            if (!compilationManager) {
              throw new Error(
                '[rsbuild:server] Can not get stats info when "runCompile" is false',
              );
            }
            await waitFirstCompileDone;
            return cacheableLoadBundle(
              lastStats[environment.index],
              entryName,
              {
                readFileSync: compilationManager.readFileSync,
                environment,
              },
            ) as T;
          },
          getTransformedHtml: async (entryName: string) => {
            if (!compilationManager) {
              throw new Error(
                '[rsbuild:server] Can not get stats info when "runCompile" is false',
              );
            }
            await waitFirstCompileDone;
            return cacheableTransformedHtml(
              lastStats[environment.index],
              entryName,
              {
                readFileSync: compilationManager.readFileSync,
                environment,
              },
            );
          },
        },
      ];
    }),
  );

  const { default: connect } = await import('../../compiled/connect/index.js');
  const middlewares = connect();

  const httpServer = middlewareMode
    ? null
    : await createHttpServer({
        serverConfig: config.server,
        middlewares,
      });

  const devServerAPI: RsbuildDevServer = {
    port,
    middlewares,
    environments: environmentAPI,
    httpServer,
    listen: async () => {
      if (!httpServer) {
        throw new Error(
          '[rsbuild:server] Can not listen dev server as `server.middlewareMode` is enabled.',
        );
      }

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

            // OPTIONS request fallback middleware
            // Should register this middleware as the last
            // see: https://github.com/web-infra-dev/rsbuild/pull/2867
            middlewares.use(optionsFallbackMiddleware);

            // 404 fallback middleware should be the last middleware
            middlewares.use(notFoundMiddleware);

            if (devMiddlewares) {
              httpServer.on('upgrade', devMiddlewares.onUpgrade);
            }

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
      await options.context.hooks.onAfterStartDevServer.callBatch({
        port,
        routes,
        environments: options.context.environments,
      });
    },
    connectWebSocket: ({ server }: { server: HTTPServer }) => {
      if (devMiddlewares) {
        server.on('upgrade', devMiddlewares.onUpgrade);
      }
    },
    close: closeServer,
    printUrls,
    open: openPage,
  };

  const postCallbacks = (
    await options.context.hooks.onBeforeStartDevServer.callBatch({
      server: devServerAPI,
      environments: options.context.environments,
    })
  ).filter((item) => typeof item === 'function');

  if (runCompile) {
    // print server url should between listen and beforeCompile
    options.context.hooks.onBeforeCreateCompiler.tap(beforeCreateCompiler);
  } else {
    beforeCreateCompiler();
  }

  const compilationManager = runCompile ? await startCompile() : undefined;

  fileWatcher = await setupWatchFiles({
    dev: devConfig,
    server: config.server,
    compilationManager,
    root,
  });

  devMiddlewares = await getDevMiddlewares({
    pwd: root,
    compilationManager,
    dev: devConfig,
    server: config.server,
    environments: environmentAPI,
    output: {
      distPath: options.context.distPath || ROOT_DIST_DIR,
    },
    postCallbacks,
  });

  for (const item of devMiddlewares.middlewares) {
    if (Array.isArray(item)) {
      middlewares.use(...item);
    } else {
      middlewares.use(item);
    }
  }

  logger.debug('create dev server done');

  return devServerAPI;
}
