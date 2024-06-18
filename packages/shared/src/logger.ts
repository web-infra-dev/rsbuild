import { type Logger, logger } from '../compiled/rslog/index.js';
import { color } from './utils';

// setup the logger level
if (process.env.DEBUG) {
  logger.level = 'verbose';
}

export const isDebug = () => {
  if (!process.env.DEBUG) {
    return false;
  }

  logger.level = 'verbose'; // support `process.env.DEBUG` in e2e
  const values = process.env.DEBUG.toLocaleLowerCase().split(',');
  return ['rsbuild', 'builder', '*'].some((key) => values.includes(key));
};

function getTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `${hours}:${minutes}:${seconds}`;
}

const { debug } = logger;

logger.debug = (message, ...args) => {
  const time = color.gray(`${getTime()}`);
  debug(`${time} ${message}`, ...args);
};

export { logger };
export type { Logger };
