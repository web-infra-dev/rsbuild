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
