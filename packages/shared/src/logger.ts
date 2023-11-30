import { logger, type Logger } from '../compiled/rslog';
import { color } from './utils';

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

export const debug = (message: string | (() => string)) => {
  if (isDebug()) {
    const { performance } = require('perf_hooks');
    const result = typeof message === 'string' ? message : message();
    const time = color.gray(`[${performance.now().toFixed(2)} ms]`);
    console.error(`${color.bold(color.yellow('debug'))}   ${result} ${time}`);
  }
};

export { logger };
export type { Logger };
