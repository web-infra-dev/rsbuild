import {
  type ExecOptions,
  type ExecSyncOptions,
  exec,
  execSync,
} from 'node:child_process';
import { stripVTControlCharacters as stripAnsi } from 'node:util';
import { BUILD_END_LOG, RSBUILD_BIN_PATH } from './constants';
import { matchPattern } from './helpers';

/**
 * Synchronously run the Rsbuild CLI with the given command.
 * @param command - The CLI command string to run (e.g., "build --config ./rsbuild.config.ts").
 * @param options - Optional options to pass to `execSync`.
 * @returns The result of `execSync`, typically a Buffer containing stdout.
 */
export function runCliSync(command: string, options?: ExecSyncOptions) {
  return execSync(`node ${RSBUILD_BIN_PATH} ${command}`, options);
}

export function runCommand(command: string, options?: ExecOptions) {
  const childProcess = exec(command, options);

  let logs: string[] = [];
  const logPatterns = new Set<{
    pattern: string | RegExp;
    resolve: (value: boolean) => void;
  }>();

  const onData = (data: Buffer) => {
    const log = stripAnsi(data.toString());
    logs.push(log);
    for (const { pattern, resolve } of logPatterns) {
      if (matchPattern(log, pattern)) {
        resolve(true);
      }
    }
  };

  childProcess.stdout?.on('data', onData);
  childProcess.stderr?.on('data', onData);

  const close = () => {
    childProcess.stdout?.off('data', onData);
    childProcess.stderr?.off('data', onData);
    childProcess.kill();
  };

  const expectLog = async (pattern: string | RegExp) => {
    if (logs.some((log) => matchPattern(log, pattern))) {
      return true;
    }

    return new Promise<boolean>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(
          new Error(
            `Timeout: Expected log pattern not found within 10 seconds: ${pattern}`,
          ),
        );
      }, 10000);

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

  const clearLogs = () => {
    logs = [];
  };

  const getLogs = () => logs;

  return {
    close,
    clearLogs,
    getLogs,
    expectLog,
    childProcess,
    expectBuildEnd,
  };
}

export function runCli(command: string, options?: ExecOptions) {
  return runCommand(`node ${RSBUILD_BIN_PATH} ${command}`, options);
}
