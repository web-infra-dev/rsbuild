import { logger } from '@rsbuild/core';
import { color } from '@rsbuild/shared';

export function createNonTTYLogger() {
  let prevPercentage = 0;

  const log = ({
    id,
    done,
    current,
    hasErrors,
    compileTime,
  }: {
    id: string;
    done: boolean;
    current: number;
    hasErrors: boolean;
    compileTime: string | null;
  }) => {
    const suffix = color.gray(`(${id})`);

    if (done) {
      // avoid printing done twice
      if (prevPercentage === 100) {
        return;
      }

      prevPercentage = 100;
      if (hasErrors) {
        logger.error(`Compile failed in ${compileTime} ${suffix}`);
      } else {
        logger.ready(`Compiled in ${compileTime} ${suffix}`);
      }
    }
    // print progress when percentage increased by more than 10%
    // because we don't want to spam the console
    else if (current - prevPercentage > 10) {
      prevPercentage = current;
      logger.info(`Compile progress: ${current.toFixed(0)}% ${suffix}`);
    }
  };

  return {
    log,
  };
}
