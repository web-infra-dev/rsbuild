import path from 'node:path';
import color from 'picocolors';
import { init } from '../cli/init';
import { isTTY } from '../helpers';
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

export const restartDevServer = async ({
  filePath,
  clear = true,
}: {
  filePath?: string;
  clear?: boolean;
} = {}): Promise<void> => {
  if (clear) {
    clearConsole();
  }

  if (filePath) {
    const filename = path.basename(filePath);
    logger.info(
      `Restart server because ${color.yellow(filename)} is changed.\n`,
    );
  } else {
    logger.info('Restarting server...\n');
  }

  for (const cleaner of cleaners) {
    await cleaner();
    cleaners = [];
  }

  const rsbuild = await init({ isRestart: true });

  // Skip the following logic if restart failed,
  // maybe user is editing config file and write some invalid config
  if (!rsbuild) {
    return;
  }

  await rsbuild.startDevServer();
};
