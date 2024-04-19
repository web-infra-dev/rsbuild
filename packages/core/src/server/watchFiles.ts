import type { DevConfig, WatchFiles } from '@rsbuild/shared';
import type { RsbuildDevMiddlewareOptions } from './getDevMiddlewares';

export async function setupWatchFiles(
  dev: DevConfig,
  compileMiddlewareAPI: RsbuildDevMiddlewareOptions['compileMiddlewareAPI'],
) {
  const { watchFiles } = dev;
  if (!watchFiles) {
    return;
  }

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

function normalizeWatchFilesOptions(
  watchFilesOptions: DevConfig['watchFiles'],
): WatchFiles | undefined {
  let normalizedWatchFilesOptions;
  if (typeof watchFilesOptions === 'string') {
    normalizedWatchFilesOptions = {
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
    normalizedWatchFilesOptions = { paths, options };
  } else {
    normalizedWatchFilesOptions = undefined;
  }

  return normalizedWatchFilesOptions;
}
