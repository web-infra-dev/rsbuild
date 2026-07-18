import path from 'node:path';
import type { ChokidarOptions } from 'chokidar';
import { init } from './cli/init';
import { color, isTTY } from './helpers';
import { getRestartManager } from './helpers/restartManager';
import type { Logger } from './logger';
import { createChokidar } from './server/watchFiles';
import type { RestartContext, RestartManager, RsbuildInstance } from './types';

const clearConsole = () => {
  if (isTTY() && !process.env.DEBUG) {
    process.stdout.write('\x1B[H\x1B[2J');
  }
};

const beforeRestart = async ({
  filePath,
  clear = true,
  action,
  logger,
  restartManager,
}: RestartContext & {
  clear?: boolean;
  logger: Logger;
  restartManager: RestartManager;
}): Promise<void> => {
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

  await restartManager.call({ action, filePath });
};

export const restartDevServer = async ({
  filePath,
  clear = true,
  logger,
  restartManager,
}: {
  filePath?: string;
  clear?: boolean;
  logger: Logger;
  restartManager: RestartManager;
}): Promise<boolean> => {
  await beforeRestart({ action: 'dev', filePath, clear, logger, restartManager });

  const rsbuild = await init({ isRestart: true });

  // Skip the following logic if restart failed,
  // maybe user is editing config file and write some invalid config
  if (!rsbuild) {
    return false;
  }

  await rsbuild.startDevServer();
  return true;
};

const restartBuild = async ({
  filePath,
  clear = true,
  logger,
  restartManager,
}: {
  filePath?: string;
  clear?: boolean;
  logger: Logger;
  restartManager: RestartManager;
}): Promise<boolean> => {
  await beforeRestart({ action: 'build', filePath, clear, logger, restartManager });

  const rsbuild = await init({ isRestart: true, isBuildWatch: true });

  // Skip the following logic if restart failed,
  // maybe user is editing config file and write some invalid config
  if (!rsbuild) {
    return false;
  }

  await rsbuild.build({ watch: true });
  return true;
};

export async function watchFilesForRestart({
  files,
  rsbuild,
  isBuildWatch,
  watchOptions,
}: {
  files: string[];
  rsbuild: RsbuildInstance;
  isBuildWatch: boolean;
  watchOptions?: ChokidarOptions;
}): Promise<void> {
  if (!files.length) {
    return;
  }

  const root = rsbuild.context.rootPath;
  const restartManager = getRestartManager(rsbuild);
  // Chokidar reports event paths relative to `cwd` when it is configured.
  const watchCwd = watchOptions?.cwd || root;
  const watcher = await createChokidar(files, root, {
    // do not trigger add for initial files
    ignoreInitial: true,
    // If watching fails due to read permissions, the errors will be suppressed silently.
    ignorePermissionErrors: true,
    ...watchOptions,
  });

  let restarting = false;

  const onChange = async (filePath: string) => {
    if (restarting) {
      return;
    }
    restarting = true;

    const absoluteFilePath = path.resolve(watchCwd, filePath);

    const restarted = isBuildWatch
      ? await restartBuild({ filePath: absoluteFilePath, logger: rsbuild.logger, restartManager })
      : await restartDevServer({
          filePath: absoluteFilePath,
          logger: rsbuild.logger,
          restartManager,
        });

    if (restarted) {
      await watcher.close();
    } else {
      rsbuild.logger.error(isBuildWatch ? 'Restart build failed.' : 'Restart server failed.');
    }

    restarting = false;
  };

  watcher.on('add', onChange);
  watcher.on('change', onChange);
  watcher.on('unlink', onChange);
}
