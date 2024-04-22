import type { DevConfig, FSWatcher } from '@rsbuild/shared';
import type { RsbuildDevMiddlewareOptions } from './getDevMiddlewares';

export async function setupWatchFiles(
  dev: DevConfig,
  compileMiddlewareAPI: RsbuildDevMiddlewareOptions['compileMiddlewareAPI'],
): Promise<FSWatcher | undefined> {
  const { watchFiles, hmr, liveReload } = dev;
  if (!watchFiles || (!hmr && !liveReload)) {
    return;
  }

  const chokidar = await import('@rsbuild/shared/chokidar');

  const { paths, options } = watchFiles;
  const watcher = chokidar.watch(paths, options);

  watcher.on('change', () => {
    if (compileMiddlewareAPI) {
      compileMiddlewareAPI.sockWrite('static-changed');
    }
  });

  return watcher;
}
