import type {
  ChokidarWatchOptions,
  CompileMiddlewareAPI,
  DevConfig,
  ServerConfig,
  WatchFiles,
} from '@rsbuild/shared';

type WatchFilesOptions = {
  dev: DevConfig;
  server: ServerConfig;
  compileMiddlewareAPI?: CompileMiddlewareAPI;
};

export async function setupWatchFiles(options: WatchFilesOptions) {
  const { dev, server, compileMiddlewareAPI } = options;

  const { hmr, liveReload } = dev;
  if (!hmr && !liveReload) return;

  const devFilesWatcher = await watchDevFiles(dev, compileMiddlewareAPI);
  const serverFilesWatcher = await watchServerFiles(
    server,
    compileMiddlewareAPI,
  );

  return {
    async close() {
      await Promise.all([
        devFilesWatcher?.close(),
        serverFilesWatcher?.close(),
      ]);
    },
  };
}

async function watchDevFiles(
  devConfig: DevConfig,
  compileMiddlewareAPI?: CompileMiddlewareAPI,
) {
  const { watchFiles } = devConfig;
  if (!watchFiles) return;

  const watchOptions = prepareWatchOptions(
    watchFiles.paths,
    watchFiles.options,
  );
  return startWatchFiles(watchOptions, compileMiddlewareAPI);
}

function watchServerFiles(
  serverConfig: ServerConfig,
  compileMiddlewareAPI?: CompileMiddlewareAPI,
) {
  const { publicDir } = serverConfig;
  if (!publicDir || !publicDir.watch || !publicDir.name) return;

  const watchOptions = prepareWatchOptions(publicDir.name);
  return startWatchFiles(watchOptions, compileMiddlewareAPI);
}

function prepareWatchOptions(
  paths: string | string[],
  options?: ChokidarWatchOptions,
) {
  return {
    paths: typeof paths === 'string' ? [paths] : paths,
    options: options ?? {},
  };
}

async function startWatchFiles(
  { paths, options }: WatchFiles,
  compileMiddlewareAPI?: CompileMiddlewareAPI,
) {
  const chokidar = await import('@rsbuild/shared/chokidar');
  const watcher = chokidar.watch(paths, options);

  watcher.on('change', () => {
    compileMiddlewareAPI?.sockWrite('static-changed');
  });

  return watcher;
}
