import type { Server } from 'node:http';
import type { Http2SecureServer } from 'node:http2';
import { color } from '../helpers';
import {
  getPublicPathFromCompiler,
  isMultiCompiler,
} from '../helpers/compiler';
import { getPathnameFromUrl } from '../helpers/path';
import { requireCompiledPackage } from '../helpers/vendors';
import { logger } from '../logger';
import { onBeforeRestartServer, restartDevServer } from '../restart';
import type {
  Connect,
  CreateCompiler,
  CreateDevServerOptions,
  EnvironmentAPI,
  InternalContext,
  NormalizedConfig,
  Rspack,
} from '../types';
import { BuildManager } from './buildManager';
import { isCliShortcutsEnabled, setupCliShortcuts } from './cliShortcuts';
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
  getAddressUrls,
  getRoutes,
  getServerConfig,
  getServerTerminator,
  printServerURLs,
  type StartServerResult,
  stripBase,
} from './helper';
import { createHttpServer } from './httpServer';
import { notFoundMiddleware, optionsFallbackMiddleware } from './middlewares';
import { open } from './open';
import type { ServerMessage } from './socketServer';
import { setupWatchFiles, type WatchFilesResult } from './watchFiles';

type HTTPServer = Server | Http2SecureServer;

type ExtractSocketMessageData<T extends ServerMessage['type']> =
  Extract<ServerMessage, { type: T }> extends { data: infer D } ? D : undefined;

export type SockWrite = <T extends ServerMessage['type']>(
  type: T,
  data?: ExtractSocketMessageData<T>,
) => void;

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
   * Notifies Rsbuild that the custom server has successfully started.
   * Rsbuild will trigger the `onAfterStartDevServer` hook at this stage.
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
  /**
   * Allows middleware to send some message to HMR client, and then the HMR
   * client will take different actions depending on the message type.
   * - `static-changed`: The page will reload.
   */
  sockWrite: SockWrite;
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
  const { context } = options;
  const routes = getRoutes(context);
  const root = context.rootPath;

  context.devServer = {
    hostname: host,
    port,
    https,
  };

  let lastStats: Rspack.Stats[];

  let waitLastCompileDoneResolve: (() => void) | null = null;
  let waitLastCompileDone = new Promise<void>((resolve) => {
    waitLastCompileDoneResolve = resolve;
  });

  const resetWaitLastCompileDone = () => {
    // No need to reset if lastStats is not set
    if (!lastStats) {
      return;
    }

    // Resolve the previous promise if it exists
    if (waitLastCompileDoneResolve) {
      waitLastCompileDoneResolve();
      waitLastCompileDoneResolve = null;
    }
    waitLastCompileDone = new Promise<void>((resolve) => {
      waitLastCompileDoneResolve = resolve;
    });
  };

  // should register onAfterDevCompile hook before startCompile
  context.hooks.onAfterDevCompile.tap(({ stats }) => {
    lastStats = 'stats' in stats ? stats.stats : [stats];
    if (waitLastCompileDoneResolve) {
      waitLastCompileDoneResolve();
      waitLastCompileDoneResolve = null;
    }
  });

  const startCompile: () => Promise<BuildManager> = async () => {
    const compiler = customCompiler || (await createCompiler());

    if (!compiler) {
      throw new Error(
        `${color.dim('[rsbuild:server]')} Failed to get compiler instance.`,
      );
    }

    const publicPaths = isMultiCompiler(compiler)
      ? compiler.compilers.map(getPublicPathFromCompiler)
      : [getPublicPathFromCompiler(compiler)];

    const { base } = config.server;
    context.publicPathnames = publicPaths
      .map(getPathnameFromUrl)
      .map((prefix) =>
        base && base !== '/' ? stripBase(prefix, base) : prefix,
      );

    compiler?.hooks.watchRun.tap('rsbuild:watchRun', () => {
      resetWaitLastCompileDone();
    });

    const buildManager = new BuildManager({
      context,
      config,
      compiler,
      resolvedPort: port,
    });

    await buildManager.init();

    return buildManager;
  };

  const protocol = https ? 'https' : 'http';
  const urls = await getAddressUrls({ protocol, port, host });

  const cliShortcutsEnabled = isCliShortcutsEnabled(config);

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

  let fileWatcher: WatchFilesResult | undefined;
  let devMiddlewares: GetDevMiddlewaresResult | undefined;

  const cleanupGracefulShutdown = middlewareMode
    ? null
    : setupGracefulShutdown();

  let closingPromise: Promise<void> | null = null;

  const closeServer = async () => {
    if (!closingPromise) {
      closingPromise = (async () => {
        // ensure closeServer is only called once
        removeCleanup(closeServer);
        cleanupGracefulShutdown?.();
        await context.hooks.onCloseDevServer.callBatch();
        await Promise.all([devMiddlewares?.close(), fileWatcher?.close()]);
      })();
    }
    return closingPromise;
  };

  if (!middlewareMode) {
    registerCleanup(closeServer);
  }

  const beforeCreateCompiler = async () => {
    printUrls();

    if (cliShortcutsEnabled) {
      const shortcutsOptions =
        typeof config.dev.cliShortcuts === 'boolean'
          ? {}
          : config.dev.cliShortcuts;

      const cleanup = await setupCliShortcuts({
        openPage,
        closeServer,
        printUrls,
        restartServer: () => restartDevServer({ clear: false }),
        help: shortcutsOptions.help,
        customShortcuts: shortcutsOptions.custom,
      });
      context.hooks.onCloseDevServer.tap(cleanup);
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
    Object.entries(context.environments).map(([name, environment]) => {
      return [
        name,
        {
          getStats: async () => {
            if (!buildManager) {
              throw new Error(
                `${color.dim('[rsbuild:server]')} Can not call ` +
                  `${color.yellow('getStats')} when ` +
                  `${color.yellow('runCompile')} is false`,
              );
            }
            await waitLastCompileDone;
            return lastStats[environment.index];
          },
          context: environment,
          loadBundle: async <T>(entryName: string) => {
            if (!buildManager) {
              throw new Error(
                `${color.dim('[rsbuild:server]')} Can not call ` +
                  `${color.yellow('loadBundle')} when ` +
                  `${color.yellow('runCompile')} is false`,
              );
            }
            await waitLastCompileDone;
            return cacheableLoadBundle(
              lastStats[environment.index],
              entryName,
              {
                readFileSync: buildManager.readFileSync,
                environment,
              },
            ) as T;
          },
          getTransformedHtml: async (entryName: string) => {
            if (!buildManager) {
              throw new Error(
                `${color.dim('[rsbuild:server]')} Can not call ` +
                  `${color.yellow('getTransformedHtml')} when ` +
                  `${color.yellow('runCompile')} is false`,
              );
            }
            await waitLastCompileDone;
            return cacheableTransformedHtml(
              lastStats[environment.index],
              entryName,
              {
                readFileSync: buildManager.readFileSync,
                environment,
              },
            );
          },
        },
      ];
    }),
  );

  const connect = requireCompiledPackage('connect');
  const middlewares = connect();

  const httpServer = middlewareMode
    ? null
    : createHttpServer({
        serverConfig: config.server,
        middlewares,
      });

  const sockWrite: SockWrite = (type, data) =>
    buildManager?.socketServer.sockWrite({
      type,
      data,
    } as ServerMessage);

  const devServerAPI: RsbuildDevServer = {
    port,
    middlewares,
    environments: environmentAPI,
    httpServer,
    sockWrite,
    listen: async () => {
      if (!httpServer) {
        throw new Error(
          `${color.dim('[rsbuild:server]')} Can not listen dev server as ` +
            `${color.yellow('server.middlewareMode')} is enabled.`,
        );
      }

      const serverTerminator = getServerTerminator(httpServer);
      logger.debug('listen dev server');

      context.hooks.onCloseDevServer.tap(serverTerminator);

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
      await context.hooks.onAfterStartDevServer.callBatch({
        port,
        routes,
        environments: context.environments,
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
    await context.hooks.onBeforeStartDevServer.callBatch({
      server: devServerAPI,
      environments: context.environments,
    })
  ).filter((item) => typeof item === 'function');

  if (runCompile) {
    // print server url should between listen and beforeCompile
    context.hooks.onBeforeCreateCompiler.tap(beforeCreateCompiler);
  } else {
    await beforeCreateCompiler();
  }

  const buildManager = runCompile ? await startCompile() : undefined;

  fileWatcher = await setupWatchFiles({
    config,
    buildManager,
    root,
  });

  devMiddlewares = getDevMiddlewares({
    buildManager,
    config,
    devServerAPI,
    context,
    postCallbacks,
  });

  for (const item of devMiddlewares.middlewares) {
    if (Array.isArray(item)) {
      middlewares.use(...item);
    } else {
      middlewares.use(item);
    }
  }

  // start watching
  buildManager?.watch();

  logger.debug('create dev server done');

  return devServerAPI;
}
