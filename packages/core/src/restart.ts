import path from 'node:path';
import type { ChokidarOptions } from 'chokidar';
import { castArray, color, isTTY } from './helpers';
import { getRestartManager, type RestartManager } from './helpers/restartManager';
import type { Logger } from './logger';
import { createChokidar } from './server/watchFiles';
import type { RestartContext, RsbuildInstance, WatchFiles } from './types';

const clearConsole = () => {
  if (isTTY() && !process.env.DEBUG) {
    process.stdout.write('\x1B[H\x1B[2J');
  }
};

export const requestRestart = ({
  filePath,
  clear = true,
  action,
  logger,
  restartManager,
}: RestartContext & {
  clear?: boolean;
  logger: Logger;
  restartManager: RestartManager;
}): Promise<boolean> => {
  if (clear) {
    clearConsole();
  }

  const id = action === 'dev' ? 'server' : 'build';

  if (filePath) {
    const filename = path.basename(filePath);
    logger.info(`restarting ${id} as ${color.yellow(filename)} changed\n`);
  } else {
    logger.info(`restarting ${id}...\n`);
  }

  return restartManager.requestRestart({ action, filePath });
};

export async function watchFilesForRestart({
  watchFiles,
  rsbuild,
  isBuildWatch,
}: {
  watchFiles: WatchFiles[];
  rsbuild: RsbuildInstance;
  isBuildWatch: boolean;
}): Promise<void> {
  const watchGroups: { files: string[]; options?: ChokidarOptions }[] = [];
  const defaultFiles: string[] = [];

  for (const { paths, options } of watchFiles) {
    const files = castArray(paths);
    if (!files.length) {
      continue;
    }

    if (options) {
      watchGroups.push({ files, options });
    } else {
      defaultFiles.push(...files);
    }
  }

  if (defaultFiles.length) {
    watchGroups.push({ files: defaultFiles });
  }

  if (!watchGroups.length) {
    return;
  }

  const root = rsbuild.context.rootPath;
  const restartManager = getRestartManager(rsbuild);
  const watchers = await Promise.all(
    watchGroups.map(async ({ files, options }) => ({
      // Chokidar reports event paths relative to `cwd` when it is configured.
      cwd: options?.cwd || root,
      watcher: await createChokidar(files, root, {
        // do not trigger add for initial files
        ignoreInitial: true,
        // If watching fails due to read permissions, the errors will be suppressed silently.
        ignorePermissionErrors: true,
        ...options,
      }),
    })),
  );

  let restarting = false;

  const onChange = async (filePath: string, cwd: string) => {
    if (restarting) {
      return;
    }
    restarting = true;

    const absoluteFilePath = path.resolve(cwd, filePath);

    const restarted = await requestRestart({
      action: isBuildWatch ? 'build' : 'dev',
      filePath: absoluteFilePath,
      logger: rsbuild.logger,
      restartManager,
    });

    if (restarted) {
      await Promise.all(watchers.map(({ watcher }) => watcher.close()));
      return;
    }

    rsbuild.logger.error(isBuildWatch ? 'Restart build failed.' : 'Restart server failed.');
    restarting = false;
  };

  for (const { cwd, watcher } of watchers) {
    const handleChange = (filePath: string) => onChange(filePath, cwd);
    watcher.on('add', handleChange);
    watcher.on('change', handleChange);
    watcher.on('unlink', handleChange);
  }
}
