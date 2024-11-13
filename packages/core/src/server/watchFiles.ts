import type { FSWatcher } from '../../compiled/chokidar/index.js';
import { normalizePublicDirs } from '../config';
import { castArray } from '../helpers';
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

  const closeDevFilesWatcher = await watchDevFiles(dev, compileMiddlewareAPI);
  const serverFilesWatcher = await watchServerFiles(
    server,
    compileMiddlewareAPI,
  );

  return {
    async close() {
      await Promise.all([
        closeDevFilesWatcher?.(),
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

  const watchers: FSWatcher[] = [];

  for (const { paths, options, type } of castArray(watchFiles)) {
    const watchOptions = prepareWatchOptions(paths, options, type);
    const watcher = await startWatchFiles(watchOptions, compileMiddlewareAPI);
    if (watcher) {
      watchers.push(watcher);
    }
  }

  return async () => {
    for (const watcher of watchers) {
      await watcher.close();
    }
  };
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
  {
    paths,
    options,
    type = 'reload-page',
  }: ReturnType<typeof prepareWatchOptions>,
  compileMiddlewareAPI: CompileMiddlewareAPI,
) {
  if (type !== 'reload-page') {
    return;
  }

  const chokidar = await import('../../compiled/chokidar/index.js');
  const watcher = chokidar.watch(paths, options);

  watcher.on('change', () => {
    compileMiddlewareAPI.sockWrite('static-changed');
  });

  return watcher;
}
