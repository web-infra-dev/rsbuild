import {
  debug,
  getNodeEnv,
  setNodeEnv,
  ROOT_DIST_DIR,
  getAddressUrls,
  isMultiCompiler,
  getPublicPathFromCompiler,
  type RsbuildDevServer,
  type StartServerResult,
  type CreateDevServerOptions,
  type StartDevServerOptions,
  type CreateDevMiddlewareReturns,
  DevConfig,
} from '@rsbuild/shared';
import { formatRoutes, getDevOptions, printServerURLs } from './helper';
import connect from '@rsbuild/shared/connect';
import { onBeforeRestartServer } from './restart';
import type { InternalContext } from '../types';
import { createHttpServer } from './httpServer';
import {
  getMiddlewares,
  type RsbuildDevMiddlewareOptions,
} from './getDevMiddlewares';
import { notFoundMiddleware } from './middlewares';

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

  const devMiddlewares = await getMiddlewares({
    pwd: options.context.rootPath,
    compileMiddlewareAPI,
    dev: devConfig,
    server: serverConfig,
    output: {
      distPath: rsbuildConfig.output?.distPath?.root || ROOT_DIST_DIR,
    },
  });

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
    onHTTPUpgrade: devMiddlewares.onUpgrade,
    close: async () => {
      await options.context.hooks.onCloseDevServer.call();
      await devMiddlewares.close();
    },
  };

  await setupWatchFiles(devConfig, compileMiddlewareAPI);

  debug('create dev server done');

  return server;
}

async function setupWatchFiles(
  dev: DevConfig,
  compileMiddlewareAPI: RsbuildDevMiddlewareOptions['compileMiddlewareAPI'],
) {
  const { watchFiles } = dev;
  if (!watchFiles) {
    return;
  }

  const normalizeWatchFilesOptions = (
    watchFilesOptions: DevConfig['watchFiles'],
  ) => {
    if (typeof watchFilesOptions === 'string') {
      watchFilesOptions = {
        paths: watchFilesOptions,
        options: {},
      };
    } else if (
      typeof watchFilesOptions === 'object' &&
      watchFilesOptions !== null
    ) {
      const { paths, options = {} } = Array.isArray(watchFilesOptions)
        ? {
            paths: watchFilesOptions,
            options: {},
          }
        : watchFilesOptions;
      watchFilesOptions = { paths, options };
    } else {
      watchFilesOptions = undefined;
    }

    return watchFilesOptions;
  };

  const watchFilesOptions = normalizeWatchFilesOptions(watchFiles);
  if (!watchFilesOptions) {
    return;
  }

  const { paths, options } = watchFilesOptions;

  const chokidar = await import('@rsbuild/shared/chokidar');
  const watcher = chokidar.watch(paths, options);

  if (dev.hmr || dev.liveReload) {
    watcher.on('change', () => {
      if (compileMiddlewareAPI) {
        compileMiddlewareAPI.sockWrite('static-changed');
      }
    });
  }
}
