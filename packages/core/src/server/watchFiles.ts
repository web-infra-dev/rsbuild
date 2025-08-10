import type { FSWatcher } from '../../compiled/chokidar/index.js';
import { normalizePublicDirs } from '../defaultConfig.js';
import { castArray } from '../helpers';
import type {
  ChokidarOptions,
  DevConfig,
  NormalizedConfig,
  ServerConfig,
  WatchFiles,
} from '../types';
import type { CompilationManager } from './compilationManager';

type WatchFilesOptions = {
  root: string;
  config: NormalizedConfig;
  compilationManager?: CompilationManager;
};

export type WatchFilesResult = {
  close(): Promise<void>;
};

export async function setupWatchFiles(
  options: WatchFilesOptions,
): Promise<WatchFilesResult | undefined> {
  const { config, root, compilationManager } = options;

  const { hmr, liveReload } = config.dev;
  if ((!hmr && !liveReload) || !compilationManager) {
    return;
  }

  const closeDevFilesWatcher = await watchDevFiles(
    config.dev,
    compilationManager,
    root,
  );
  const serverFilesWatcher = await watchServerFiles(
    config.server,
    compilationManager,
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
  compilationManager: CompilationManager,
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
      compilationManager,
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

async function watchServerFiles(
  serverConfig: ServerConfig,
  compilationManager: CompilationManager,
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
  return startWatchFiles(watchOptions, compilationManager, root);
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

const GLOB_REGEX = /[*?{}[\]()!@+|]/;
/**
 * A simple glob pattern checker.
 * This can help us to avoid unnecessary tinyglobby import and call.
 */
const isGlob = (str: string): boolean => GLOB_REGEX.test(str);

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
  compilationManager: CompilationManager,
  root: string,
) {
  if (type !== 'reload-page') {
    return;
  }

  const watcher = await createChokidar(paths, root, options);

  watcher.on('change', () => {
    compilationManager.socketServer.sockWrite({
      type: 'static-changed',
    });
  });

  return watcher;
}
