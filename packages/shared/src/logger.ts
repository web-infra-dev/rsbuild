import { logger, type Logger } from '../compiled/rslog';
import { color } from './utils';

// setup the logger level
if (process.env.DEBUG) {
  logger.level = 'verbose';
}

export const isDebug = () => {
  if (!process.env.DEBUG) {
    return false;
  }

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

export const debug = (message: string | (() => string)) => {
  if (isDebug()) {
    const result = typeof message === 'string' ? message : message();
    const time = color.gray(`${getTime()}`);
    logger.debug(`${time} ${result}`);
  }
};

export { logger };
export type { Logger };
