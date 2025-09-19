import {
  type ExecOptions,
  type ExecSyncOptions,
  exec,
  execSync,
} from 'node:child_process';
import { RSBUILD_BIN_PATH } from './constants';
import { createLogHelper } from './logs';

/**
 * Synchronously run the Rsbuild CLI with the given command.
 * @param command - The CLI command string to run (e.g., "build --config ./rsbuild.config.ts").
 * @param options - Optional options to pass to `execSync`.
 * @returns The result of `execSync`, typically a Buffer containing stdout.
 */
export function runCliSync(command: string, options?: ExecSyncOptions) {
  return execSync(`node ${RSBUILD_BIN_PATH} ${command}`, options);
}

function runCommand(command: string, options?: ExecOptions) {
  const childProcess = exec(command, options);

  const logHelper = createLogHelper();

  const onData = (data: Buffer) => {
    logHelper.addLog(data.toString());
  };

  childProcess.stdout?.on('data', onData);
  childProcess.stderr?.on('data', onData);

  const close = () => {
    childProcess.stdout?.off('data', onData);
    childProcess.stderr?.off('data', onData);
    childProcess.kill();
  };

  return {
    ...logHelper,
    close,
    childProcess,
  };
}

export function runCli(command: string, options?: ExecOptions) {
  return runCommand(`node ${RSBUILD_BIN_PATH} ${command}`, options);
}
