import { logger, type Logger } from 'rslog';
import chalk from 'chalk';

export const isDebug = () =>
  process.env.DEBUG === 'rsbuild' ||
  // the legacy usage
  process.env.DEBUG === 'builder';

export const debug = (message: string | (() => string)) => {
  if (isDebug()) {
    const { performance } = require('perf_hooks');
    const result = typeof message === 'string' ? message : message();
    const time = chalk.gray(`[${performance.now().toFixed(2)} ms]`);
    console.error(`${chalk.yellow.bold('debug')}   ${result} ${time}`);
  }
};

export { logger };
export type { Logger };
