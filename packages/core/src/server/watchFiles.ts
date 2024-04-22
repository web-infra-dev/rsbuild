import type { DevConfig, WatchFiles } from '@rsbuild/shared';
import type { RsbuildDevMiddlewareOptions } from './getDevMiddlewares';

export async function setupWatchFiles(
  dev: DevConfig,
  compileMiddlewareAPI: RsbuildDevMiddlewareOptions['compileMiddlewareAPI'],
) {
  const { watchFiles, hmr, liveReload } = dev;
  if (!watchFiles || (!hmr && !liveReload)) {
    return;
  }

  const watchFilesOptions = normalizeWatchFilesOptions(watchFiles);
  if (!watchFilesOptions) {
    return;
  }

  const chokidar = await import('@rsbuild/shared/chokidar');

  const { paths, options } = watchFilesOptions;
  const watcher = chokidar.watch(paths, options);

  watcher.on('change', () => {
    if (compileMiddlewareAPI) {
      compileMiddlewareAPI.sockWrite('static-changed');
    }
  });
}

function normalizeWatchFilesOptions(
  watchFilesOptions: DevConfig['watchFiles'],
): WatchFiles | undefined {
  if (typeof watchFilesOptions === 'string') {
    return {
      paths: watchFilesOptions,
      options: {},
    };
  }

  if (Array.isArray(watchFilesOptions)) {
    return {
      paths: watchFilesOptions,
      options: {},
    };
  }

  if (typeof watchFilesOptions === 'object' && watchFilesOptions !== null) {
    const { paths = [], options = {} } = watchFilesOptions;
    return {
      paths,
      options,
    };
  }

  return undefined;
}
