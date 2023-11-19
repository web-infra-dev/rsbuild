import path from 'path';
import { color, logger } from '@rsbuild/shared';
import { init } from '../cli/commands';

type Cleaner = () => Promise<unknown> | unknown;

const cleaners: Cleaner[] = [];

/**
 * Add a cleaner to handle side effects
 */
export const registerCleaner = (cleaner: Cleaner) => {
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
  }

  const rsbuild = await init();

  await rsbuild.startDevServer();
};
