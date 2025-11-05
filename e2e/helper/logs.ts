import { stripVTControlCharacters as stripAnsi } from 'node:util';
import type { ConsoleType } from '@rsbuild/core';
import color from 'picocolors';
import { BUILD_END_LOG } from './constants';
import { toPosixPath } from './utils';

type LogPattern = string | RegExp | ((log: string) => boolean);

type MatchPatternOptions = {
  /**
   * Whether to use exact line matching instead of substring matching
   * @default false
   */
  strict?: boolean;
  /**
   * Whether to convert file paths to POSIX format before matching
   * @default false
   */
  posix?: boolean;
};

const matchPattern = (
  log: string,
  pattern: LogPattern,
  options: MatchPatternOptions = {},
) => {
  const logToCheck = options.posix ? toPosixPath(log) : log;
  if (typeof pattern === 'string') {
    return options.strict
      ? logToCheck.split('\n').some((line) => line.trim() === pattern.trim())
      : logToCheck.includes(pattern);
  }
  if (pattern instanceof RegExp) {
    return pattern.test(logToCheck);
  }
  return pattern(logToCheck);
};

export const createLogHelper = () => {
  const logs: string[] = [];
  const originalLogs: string[] = [];

  const logPatterns = new Set<{
    pattern: LogPattern;
    resolve: (value: boolean) => void;
    options: MatchPatternOptions;
  }>();

  const clearLogs = () => {
    logs.splice(0);
  };

  const addLog = (input: string) => {
    const log = stripAnsi(input);
    logs.push(log);
    originalLogs.push(input);

    for (const { pattern, resolve, options } of logPatterns) {
      if (matchPattern(log, pattern, options)) {
        resolve(true);
      }
    }
  };

  const expectLog = async (
    pattern: LogPattern,
    options: MatchPatternOptions = {},
  ) => {
    if (logs.some((log) => matchPattern(log, pattern, options))) {
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
            `${title}\nExpect: ${expect}\nGet:\n${originalLogs.join('\n')}`,
          ),
        );
      }, 5000);

      const patternEntry = {
        pattern,
        options,
        resolve: (value: boolean) => {
          clearTimeout(timeoutId);
          logPatterns.delete(patternEntry);
          resolve(value);
        },
      };

      logPatterns.add(patternEntry);
    });
  };

  const expectNoLog = (
    pattern: LogPattern,
    options: MatchPatternOptions = {},
  ) => {
    return !logs.some((log) => matchPattern(log, pattern, options));
  };

  const expectBuildEnd = async () => expectLog(BUILD_END_LOG);

  return {
    logs,
    originalLogs,
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

export type ExtendedLogHelper = LogHelper & {
  /**
   * Restore the original console methods
   */
  restore: () => void;
  /**
   * Restore the original console methods and print the captured logs
   */
  printCapturedLogs: () => void;
};

/**
 * Proxy the console methods to capture the logs
 */
export const proxyConsole = ({
  types = ['log', 'warn', 'info', 'error'],
}: ProxyConsoleOptions = {}): ExtendedLogHelper => {
  const restores: Array<() => void> = [];
  const logHelper = createLogHelper();

  for (const type of Array.isArray(types) ? types : [types]) {
    const method = console[type];
    restores.push(() => {
      console[type] = method;
    });
    console[type] = (...args: unknown[]) => {
      const logMessage = args
        .map((arg) => {
          if (typeof arg === 'string') {
            return arg;
          }
          return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
        })
        .join(' ');
      logHelper.addLog(logMessage);
    };
  }

  const restore = () => {
    for (const restore of restores) {
      restore();
    }
  };

  const printCapturedLogs = () => {
    restore();
    console.log(logHelper.originalLogs.join('\n'));
  };

  return {
    restore,
    printCapturedLogs,
    ...logHelper,
  };
};
