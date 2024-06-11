import fs from 'node:fs';
import { isAbsolute, join } from 'node:path';
import {
  type CreateDevServerOptions,
  type MultiStats,
  ROOT_DIST_DIR,
  type Rspack,
  type StartDevServerOptions,
  type Stats,
  debug,
  getNodeEnv,
  getPublicPathFromCompiler,
  isMultiCompiler,
  setNodeEnv,
} from '@rsbuild/shared';
import type Connect from 'connect';
import type { CreateDevMiddlewareReturns } from '../provider/createCompiler';
import type { InternalContext, NormalizedConfig } from '../types';
import {
  type RsbuildDevMiddlewareOptions,
  getMiddlewares,
} from './getDevMiddlewares';
import {
  type StartServerResult,
  type UpgradeEvent,
  formatRoutes,
  getAddressUrls,
  getDevConfig,
  getServerConfig,
  printServerURLs,
} from './helper';
import { createHttpServer } from './httpServer';
import { notFoundMiddleware } from './middlewares';
import { onBeforeRestartServer } from './restart';
import { type ServerUtils, getTransformedHtml, ssrLoadModule } from './ssr';
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

  /**
   * Load and execute SSR module in Server.
   *
   * @param entryName - relate to rsbuild source.entry
   * @returns the return of server-entry.
   */
  ssrLoadModule: <T>(entryName: string) => Promise<T>;

  /**
   * Get the compiled HTML template.
   */
  getTransformedHtml: (entryName: string) => Promise<string>;
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

  debug('create dev server');

  const serverConfig = config.server;
  const { port, host, https } = await getServerConfig({
    config,
    getPortSilently,
  });
  const devConfig = getDevConfig({
    config,
    port,
  });

  const routes = formatRoutes(
    options.context.entry,
    config.output.distPath.html,
    config.html.outputStructure,
  );

  options.context.devServer = {
    hostname: host,
    port,
    https,
  };

  let outputFileSystem: Rspack.OutputFileSystem = fs;

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
      server: serverConfig,
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

  await options.context.hooks.onBeforeStartDevServer.call();

  if (runCompile) {
    options.context.hooks.onBeforeCreateCompiler.tap(() => {
      // print server url should between listen and beforeCompile
      printServerURLs({
        urls,
        port,
        routes,
        protocol,
        printUrls: serverConfig.printUrls,
      });
    });
  } else {
    printServerURLs({
      urls,
      port,
      routes,
      protocol,
      printUrls: serverConfig.printUrls,
    });
  }

  let _stats: Stats | MultiStats;

  // should register onDevCompileDone hook before startCompile
  const waitFirstCompileDone = new Promise<void>((resolve) => {
    options.context.hooks.onDevCompileDone.tap(({ stats, isFirstCompile }) => {
      _stats = stats;

      if (!isFirstCompile) {
        return;
      }
      resolve();
    });
  });

  const compileMiddlewareAPI = runCompile ? await startCompile() : undefined;

  const fileWatcher = await setupWatchFiles({
    dev: devConfig,
    server: serverConfig,
    compileMiddlewareAPI,
  });

  const distPath = config.output.distPath.root || ROOT_DIST_DIR;
  const pwd = options.context.rootPath;

  const devMiddlewares = await getMiddlewares({
    pwd,
    compileMiddlewareAPI,
    dev: devConfig,
    server: serverConfig,
    output: {
      distPath,
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

  const serverUtils: ServerUtils = {
    readFileSync: (fileName: string) => {
      if ('readFileSync' in outputFileSystem) {
        // bundle require needs a synchronous method, although readFileSync is not within the outputFileSystem type definition, but nodejs fs API implemented.
        // @ts-expect-error
        return outputFileSystem.readFileSync(fileName, 'utf-8');
      }
      return fs.readFileSync(fileName, 'utf-8');
    },
    distPath: isAbsolute(distPath) ? distPath : join(pwd, distPath),
    getHTMLPaths: options.context.pluginAPI!.getHTMLPaths,
  };

  const server = {
    port,
    middlewares,
    outputFileSystem,
    listen: async () => {
      const httpServer = await createHttpServer({
        serverConfig,
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
    afterListen: async () => {
      await options.context.hooks.onAfterStartDevServer.call({
        port,
        routes,
      });
    },
    ssrLoadModule: async <T>(entryName: string) => {
      await waitFirstCompileDone;
      return ssrLoadModule<T>(_stats, entryName, serverUtils);
    },
    getTransformedHtml: async (entryName: string) => {
      await waitFirstCompileDone;
      return getTransformedHtml(entryName, serverUtils);
    },
    onHTTPUpgrade: devMiddlewares.onUpgrade,
    close: async () => {
      await options.context.hooks.onCloseDevServer.call();
      await devMiddlewares.close();
      await fileWatcher?.close();
    },
  };

  debug('create dev server done');

  return server;
}
