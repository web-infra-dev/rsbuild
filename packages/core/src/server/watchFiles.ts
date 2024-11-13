import isGlob from 'is-glob';
import type { FSWatcher } from '../../compiled/chokidar/index.js';
import { normalizePublicDirs } from '../config';
import { castArray } from '../helpers';
import type {
  ChokidarOptions,
  DevConfig,
  ServerConfig,
  WatchFiles,
} from '../types';
import type { CompileMiddlewareAPI } from './getDevMiddlewares';

type WatchFilesOptions = {
  dev: DevConfig;
  server: ServerConfig;
  compileMiddlewareAPI?: CompileMiddlewareAPI;
  root: string;
};

export async function setupWatchFiles(options: WatchFilesOptions): Promise<
  | {
      close(): Promise<void>;
    }
  | undefined
> {
  const { dev, server, root, compileMiddlewareAPI } = options;

  const { hmr, liveReload } = dev;
  if ((!hmr && !liveReload) || !compileMiddlewareAPI) {
    return;
  }

  const closeDevFilesWatcher = await watchDevFiles(
    dev,
    compileMiddlewareAPI,
    root,
  );
  const serverFilesWatcher = await watchServerFiles(
    server,
    compileMiddlewareAPI,
    root,
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
  root: string,
) {
  const { watchFiles } = devConfig;
  if (!watchFiles) {
    return;
  }

  const watchers: FSWatcher[] = [];

  for (const { paths, options, type } of castArray(watchFiles)) {
    const watchOptions = prepareWatchOptions(paths, options, type);
    const watcher = await startWatchFiles(
      watchOptions,
      compileMiddlewareAPI,
      root,
    );
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
  root: string,
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
  return startWatchFiles(watchOptions, compileMiddlewareAPI, root);
}

function prepareWatchOptions(
  paths: string | string[],
  options: ChokidarOptions = {},
  type?: WatchFiles['type'],
) {
  return {
    paths: typeof paths === 'string' ? [paths] : paths,
    options,
    type,
  };
}

export async function createChokidar(
  pathOrGlobs: string[],
  root: string,
  options: ChokidarOptions,
): Promise<FSWatcher> {
  const chokidar = await import('../../compiled/chokidar/index.js');

  const watchFiles: Set<string> = new Set();

  const globPatterns = pathOrGlobs.filter((pathOrGlob) => {
    if (isGlob(pathOrGlob)) {
      return true;
    }
    watchFiles.add(pathOrGlob);
    return false;
  });

  if (globPatterns.length) {
    const tinyglobby = await import('../../compiled/tinyglobby/index.js');
    // interop default to make both CJS and ESM work
    const { glob } = tinyglobby.default || tinyglobby;
    const files = await glob(globPatterns, {
      cwd: root,
      absolute: true,
    });
    for (const file of files) {
      watchFiles.add(file);
    }
  }

  return chokidar.watch(Array.from(watchFiles), options);
}

async function startWatchFiles(
  {
    paths,
    options,
    type = 'reload-page',
  }: ReturnType<typeof prepareWatchOptions>,
  compileMiddlewareAPI: CompileMiddlewareAPI,
  root: string,
) {
  if (type !== 'reload-page') {
    return;
  }

  const watcher = await createChokidar(paths, root, options);

  watcher.on('change', () => {
    compileMiddlewareAPI.sockWrite('static-changed');
  });

  return watcher;
}
