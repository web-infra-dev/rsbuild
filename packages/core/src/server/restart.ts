import path from 'path';
import { color, logger } from '@rsbuild/shared';
import { init } from '../cli/commands';

type Cleaner = () => Promise<unknown> | unknown;

let cleaners: Cleaner[] = [];

/**
 * Add a cleaner to handle side effects
 */
export const onBeforeRestartServer = (cleaner: Cleaner) => {
  cleaners.push(cleaner);
};

const clearConsole = () => {
  if (process.stdout.isTTY && !process.env.DEBUG) {
    process.stdout.write('\x1B[H\x1B[2J');
  }
};

export const restartDevServer = async ({ filePath }: { filePath: string }) => {
  clearConsole();

  const filename = path.basename(filePath);
  logger.info(`Restart because ${color.yellow(filename)} is changed.\n`);

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
