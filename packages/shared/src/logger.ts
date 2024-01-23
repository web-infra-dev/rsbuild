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

  const flag = process.env.DEBUG.toLocaleLowerCase();
  return (
    flag === 'rsbuild' ||
    // compat the legacy usage from Modern.js Builder
    flag === 'builder'
  );
};

export const debug = (message: string | (() => string), showTime = true) => {
  if (isDebug()) {
    const { performance } = require('perf_hooks');
    const result = typeof message === 'string' ? message : message();
    if (showTime) {
      const time = color.gray(`[${performance.now().toFixed(2)} ms]`);
      logger.debug(`${result} ${time}`);
    } else {
      logger.debug(result);
    }
  }
};

export { logger };
export type { Logger };
