import path from 'node:path';
import { init } from '../cli/init';
import { color, isTTY } from '../helpers';
import { logger } from '../logger';

type Cleaner = () => Promise<unknown> | unknown;

let cleaners: Cleaner[] = [];

/**
 * Add a cleaner to handle side effects
 */
export const onBeforeRestartServer = (cleaner: Cleaner): void => {
  cleaners.push(cleaner);
};

const clearConsole = () => {
  if (isTTY() && !process.env.DEBUG) {
    process.stdout.write('\x1B[H\x1B[2J');
  }
};

const beforeRestart = async ({
  filePath,
  clear = true,
  id,
}: {
  filePath?: string;
  clear?: boolean;
  id: string;
}): Promise<void> => {
  if (clear) {
    clearConsole();
  }

  if (filePath) {
    const filename = path.basename(filePath);
    logger.info(
      `Restart ${id} because ${color.yellow(filename)} is changed.\n`,
    );
  } else {
    logger.info(`Restarting ${id}...\n`);
  }

  for (const cleaner of cleaners) {
    await cleaner();
  }
  cleaners = [];
};

export const restartDevServer = async ({
  filePath,
  clear = true,
}: {
  filePath?: string;
  clear?: boolean;
} = {}): Promise<void> => {
  await beforeRestart({ filePath, clear, id: 'server' });

  const rsbuild = await init({ isRestart: true });

  // Skip the following logic if restart failed,
  // maybe user is editing config file and write some invalid config
  if (!rsbuild) {
    return;
  }

  await rsbuild.startDevServer();
};

export const restartBuild = async ({
  filePath,
  clear = true,
}: {
  filePath?: string;
  clear?: boolean;
} = {}): Promise<void> => {
  await beforeRestart({ filePath, clear, id: 'build' });

  const rsbuild = await init({ isRestart: true, isBuildWatch: true });

  // Skip the following logic if restart failed,
  // maybe user is editing config file and write some invalid config
  if (!rsbuild) {
    return;
  }

  const buildInstance = await rsbuild.build({ watch: true });

  onBeforeRestartServer(buildInstance.close);
};
