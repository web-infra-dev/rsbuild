import { stripVTControlCharacters as stripAnsi } from 'node:util';
import type { ConsoleType } from '@rsbuild/core';
import color from 'picocolors';
import { BUILD_END_LOG } from './constants';

type LogPattern = string | RegExp | ((log: string) => boolean);

const matchPattern = (log: string, pattern: LogPattern) => {
  if (typeof pattern === 'string') {
    return log.includes(pattern);
  }
  if (pattern instanceof RegExp) {
    return pattern.test(log);
  }
  return pattern(log);
};

export const createLogHelper = () => {
  const logs: string[] = [];

  const logPatterns = new Set<{
    pattern: LogPattern;
    resolve: (value: boolean) => void;
  }>();

  const clearLogs = () => {
    logs.splice(0);
  };

  const addLog = (input: string) => {
    const log = stripAnsi(input);
    logs.push(log);
    for (const { pattern, resolve } of logPatterns) {
      if (matchPattern(log, pattern)) {
        resolve(true);
      }
    }
  };

  const expectLog = async (pattern: LogPattern) => {
    if (logs.some((log) => matchPattern(log, pattern))) {
      return true;
    }

    return new Promise<boolean>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        const title = color.bold(
          color.red('Timeout: Expected log not found within 5 seconds.'),
        );
        const expect = color.yellow(pattern.toString());
        reject(
          new Error(
            `${title}\nExpect: ${expect}\nGet:\n${color.cyan(logs.join('\n'))}`,
          ),
        );
      }, 5000);

      const patternEntry = {
        pattern,
        resolve: (value: boolean) => {
          clearTimeout(timeoutId);
          logPatterns.delete(patternEntry);
          resolve(value);
        },
      };

      logPatterns.add(patternEntry);
    });
  };

  const expectNoLog = (pattern: LogPattern) => {
    return !logs.some((log) => matchPattern(log, pattern));
  };

  const expectBuildEnd = async () => expectLog(BUILD_END_LOG);

  return {
    logs,
    addLog,
    clearLogs,
    expectLog,
    expectNoLog,
    expectBuildEnd,
  };
};

export type LogHelper = ReturnType<typeof createLogHelper>;

export type ProxyConsoleOptions = {
  types?: ConsoleType | ConsoleType[];
};

/**
 * Proxy the console methods to capture the logs
 */
export const proxyConsole = ({
  types = ['log', 'warn', 'info', 'error'],
}: ProxyConsoleOptions = {}): LogHelper & {
  restore: () => void;
} => {
  const restores: Array<() => void> = [];
  const logMatcher = createLogHelper();

  for (const type of Array.isArray(types) ? types : [types]) {
    const method = console[type];
    restores.push(() => {
      console[type] = method;
    });
    console[type] = (...args: any[]) => {
      const logMessage = args
        .map((arg) => {
          if (typeof arg === 'string') {
            return arg;
          }
          return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
        })
        .join(' ');
      logMatcher.addLog(logMessage);
    };
  }

  const restore = () => {
    for (const restore of restores) {
      restore();
    }
  };

  return {
    restore,
    ...logMatcher,
  };
};
