import fs from 'node:fs';
import {
  type CreateDevMiddlewareReturns,
  type CreateDevServerOptions,
  type MultiStats,
  type OutputFileSystem,
  ROOT_DIST_DIR,
  type RsbuildDevServer,
  type StartDevServerOptions,
  type StartServerResult,
  type Stats,
  debug,
  getNodeEnv,
  getPublicPathFromCompiler,
  isMultiCompiler,
  setNodeEnv,
} from '@rsbuild/shared';
import connect from '@rsbuild/shared/connect';
import type { InternalContext } from '../types';
import {
  type RsbuildDevMiddlewareOptions,
  getMiddlewares,
} from './getDevMiddlewares';
import {
  formatRoutes,
  getAddressUrls,
  getDevOptions,
  printServerURLs,
} from './helper';
import { createHttpServer } from './httpServer';
import { notFoundMiddleware } from './middlewares';
import { onBeforeRestartServer } from './restart';
import { type ServerUtils, getTransformedHtml, ssrLoadModule } from './ssr';
import { setupWatchFiles } from './watchFiles';

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
  }: CreateDevServerOptions = {},
): Promise<RsbuildDevServer> {
  if (!getNodeEnv()) {
    setNodeEnv('development');
  }

  debug('create dev server');

  const rsbuildConfig = options.context.config;

  const { devConfig, serverConfig, port, host, https } = await getDevOptions({
    rsbuildConfig,
    getPortSilently,
  });

  const routes = formatRoutes(
    options.context.entry,
    rsbuildConfig.output?.distPath?.html,
    rsbuildConfig.html?.outputStructure,
  );

  options.context.devServer = {
    hostname: host,
    port,
    https,
  };

  let outputFileSystem: OutputFileSystem = fs;

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

    compilerDevMiddleware.init();

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

  const compileMiddlewareAPI = runCompile ? await startCompile() : undefined;

  const fileWatcher = await setupWatchFiles({
    dev: devConfig,
    server: serverConfig,
    compileMiddlewareAPI,
  });

  const distPath = rsbuildConfig.output?.distPath?.root || ROOT_DIST_DIR;

  const devMiddlewares = await getMiddlewares({
    pwd: options.context.rootPath,
    compileMiddlewareAPI,
    dev: devConfig,
    server: serverConfig,
    output: {
      distPath,
    },
    outputFileSystem,
  });

  const middlewares = connect();

  for (const item of devMiddlewares.middlewares) {
    if (Array.isArray(item)) {
      middlewares.use(...item);
    } else {
      middlewares.use(item);
    }
  }

  const serverUtils: ServerUtils = {
    readFile: (fileName: string) =>
      new Promise<string>((resolve, reject) => {
        outputFileSystem.readFile(fileName, (err, data) => {
          if (err) {
            return reject(err);
          }

          resolve(data!.toString());
        });
      }),
    distPath,
    getHTMLPaths: options.context.pluginAPI!.getHTMLPaths,
  };

  let _stats: Stats | MultiStats;

  const waitFirstCompileDone = new Promise<void>((resolve) => {
    options.context.hooks.onDevCompileDone.tap(({ stats, isFirstCompile }) => {
      _stats = stats;

      if (!isFirstCompile) {
        return;
      }
      resolve();
    });
  });

  const server = {
    port,
    middlewares,
    outputFileSystem,
    listen: async () => {
      const httpServer = await createHttpServer({
        https: serverConfig.https,
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
    ssrLoadModule: async (entryName: string) => {
      await waitFirstCompileDone;
      return ssrLoadModule(_stats, entryName, serverUtils);
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
