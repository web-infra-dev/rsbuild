import { stripVTControlCharacters as stripAnsi } from 'node:util';
import type { ConsoleType } from '@rsbuild/core';
import color from 'picocolors';
import { BUILD_END_LOG } from './constants';

export type LogPattern = {
  pattern: string | RegExp;
  resolve: (value: boolean) => void;
};

const matchPattern = (log: string, pattern: string | RegExp) => {
  if (typeof pattern === 'string') {
    return log.includes(pattern);
  }
  return pattern.test(log);
};

export const createLogMatcher = () => {
  const logs: string[] = [];

  const logPatterns = new Set<{
    pattern: string | RegExp;
    resolve: (value: boolean) => void;
  }>();

  const clearLogs = () => {
    logs.length = 0;
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

  const expectLog = async (pattern: string | RegExp) => {
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

  const expectBuildEnd = async () => expectLog(BUILD_END_LOG);

  return {
    logs,
    addLog,
    clearLogs,
    expectLog,
    expectBuildEnd,
  };
};

export type CreateLogMatcher = ReturnType<typeof createLogMatcher>;

export type ProxyConsoleOptions = {
  types?: ConsoleType | ConsoleType[];
};

export type ProxyConsoleResult = CreateLogMatcher & {
  restore: () => void;
};

/**
 * Proxy the console methods to capture the logs
 */
export const proxyConsole = ({
  types = ['log', 'warn', 'info', 'error'],
}: ProxyConsoleOptions = {}): ProxyConsoleResult => {
  const restores: Array<() => void> = [];
  const logMatcher = createLogMatcher();

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
