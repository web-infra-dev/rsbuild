/**
 * Logging message case convention:
 *
 * Info, ready, success and debug messages:
 * - Start with lowercase
 * - Example: "info  build started..."
 *
 * Errors and warnings:
 * - Start with uppercase
 * - Example: "error  Failed to build"
 *
 * This convention helps distinguish between normal operations
 * and important alerts that require attention.
 */

import { createLogger as baseCreateLogger, type Logger, logger } from 'rslog';

export const isDebug = (): boolean => {
  if (!process.env.DEBUG) {
    return false;
  }

  const values = process.env.DEBUG.toLocaleLowerCase().split(',');
  return ['rsbuild', 'builder', '*'].some((key) => values.includes(key));
};

export const isVerbose = (): boolean => logger.level === 'verbose';

// setup the logger level
if (isDebug()) {
  logger.level = 'verbose';
}

function getTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `${hours}:${minutes}:${seconds}`;
}

export const createLogger = (
  ...args: Parameters<typeof baseCreateLogger>
): ReturnType<typeof baseCreateLogger> => {
  const instance = baseCreateLogger(...args);

  if (isDebug() && args[0]?.level === undefined) {
    instance.level = 'verbose';
  }

  return instance;
};

export { logger };
export type { Logger };
