import { normalizePublicDirs } from '../config';
import type {
  ChokidarWatchOptions,
  DevConfig,
  ServerConfig,
  WatchFiles,
} from '../types';
import type { CompileMiddlewareAPI } from './getDevMiddlewares';

type WatchFilesOptions = {
  dev: DevConfig;
  server: ServerConfig;
  compileMiddlewareAPI?: CompileMiddlewareAPI;
};

export async function setupWatchFiles(options: WatchFilesOptions): Promise<
  | {
      close(): Promise<void>;
    }
  | undefined
> {
  const { dev, server, compileMiddlewareAPI } = options;

  const { hmr, liveReload } = dev;
  if ((!hmr && !liveReload) || !compileMiddlewareAPI) {
    return;
  }

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
  compileMiddlewareAPI: CompileMiddlewareAPI,
) {
  const { watchFiles } = devConfig;
  if (!watchFiles) {
    return;
  }

  const watchOptions = prepareWatchOptions(
    watchFiles.paths,
    watchFiles.options,
    watchFiles.type,
  );
  return startWatchFiles(watchOptions, compileMiddlewareAPI);
}

function watchServerFiles(
  serverConfig: ServerConfig,
  compileMiddlewareAPI: CompileMiddlewareAPI,
) {
  const publicDirs = normalizePublicDirs(serverConfig.publicDir);
  if (!publicDirs.length) {
    return;
  }

  const watchPaths = publicDirs
    .filter((item) => item.watch)
    .map((item) => item.name);

  if (!watchPaths.length) {
    return;
  }

  const watchOptions = prepareWatchOptions(watchPaths);
  return startWatchFiles(watchOptions, compileMiddlewareAPI);
}

function prepareWatchOptions(
  paths: string | string[],
  options: ChokidarWatchOptions = {},
  type?: WatchFiles['type'],
) {
  return {
    paths: typeof paths === 'string' ? [paths] : paths,
    options,
    type,
  };
}

async function startWatchFiles(
  { paths, options, type }: ReturnType<typeof prepareWatchOptions>,
  compileMiddlewareAPI: CompileMiddlewareAPI,
) {
  // If `type` is not 'reload-server', treat it as 'reload-page'.
  if (type !== 'reload-server') {
    const chokidar = await import('chokidar');
    const watcher = chokidar.watch(paths, options);

    watcher.on('change', () => {
      compileMiddlewareAPI.sockWrite('static-changed');
    });

    return watcher;
  }
}
