import path from 'node:path';
import type { ChokidarOptions } from 'chokidar';
import { castArray, color, isTTY } from './helpers';
import type { RestartManager } from './helpers/restartManager';
import type { Logger } from './logger';
import { createChokidar, type WatchFilesResult } from './server/watchFiles';
import type { InternalContext, RestartContext, WatchFiles } from './types';

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
  if (restartManager.canRestart) {
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
  }

  return restartManager.requestRestart({ action, filePath });
};

export function watchFilesForRestart({
  watchFiles,
  context,
  action,
}: {
  watchFiles: WatchFiles[];
  context: InternalContext;
  action: RestartContext['action'];
}): WatchFilesResult | undefined {
  const defaultFiles = context.configFile
    ? [context.configFile, ...context.configFileDependencies]
    : [];

  if (!watchFiles.length && !defaultFiles.length) {
    return;
  }

  const watchGroups: { files: string[]; options?: ChokidarOptions }[] = [];

  for (const { paths, options, type } of watchFiles) {
    if (type !== 'restart' && type !== 'reload-server') {
      continue;
    }

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

  const { logger, restartManager, rootPath: root } = context;
  let restarting = false;
  let closePromise: Promise<void> | undefined;

  const onChange = async (filePath: string, cwd: string) => {
    if (restarting || closePromise) {
      return;
    }
    restarting = true;

    const absoluteFilePath = path.resolve(cwd, filePath);

    try {
      const restarted = await requestRestart({
        action,
        filePath: absoluteFilePath,
        logger,
        restartManager,
      });

      // Close only after success; otherwise keep watching for a retry.
      if (restarted) {
        await close();
      } else if (restartManager.canRestart) {
        logger.error(action === 'build' ? 'Restart build failed.' : 'Restart server failed.');
      }
    } catch (error) {
      logger.error(error);
    } finally {
      restarting = false;
    }
  };

  // Initialize watchers in the background so task startup is not delayed.
  const watchersPromise = Promise.all(
    watchGroups.map(async ({ files, options }) => {
      try {
        const watcher = await createChokidar(files, root, {
          // Avoid initial add events.
          ignoreInitial: true,
          // Ignore file permission errors.
          ignorePermissionErrors: true,
          ...options,
        });
        // Chokidar reports event paths relative to `cwd` when it is configured.
        const cwd = options?.cwd || root;
        const handleChange = (filePath: string) => void onChange(filePath, cwd);
        watcher.on('add', handleChange);
        watcher.on('change', handleChange);
        watcher.on('unlink', handleChange);
        return watcher;
      } catch (error) {
        logger.error(error);
      }
    }),
  );

  const close = () => {
    if (!closePromise) {
      closePromise = watchersPromise
        .then((watchers) => Promise.all(watchers.map((watcher) => watcher?.close())))
        .then(() => {});
    }
    return closePromise;
  };

  return { close };
}
