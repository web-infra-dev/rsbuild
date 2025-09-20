import { type ExecSyncOptions, execSync } from 'node:child_process';
import { RSBUILD_BIN_PATH } from './constants';

/**
 * Synchronously run the Rsbuild CLI with the given command.
 * @param command - The CLI command string to run (e.g., "build --config ./rsbuild.config.ts").
 * @param options - Optional options to pass to `execSync`.
 * @returns The result of `execSync`, typically a Buffer containing stdout.
 */
export function runCliSync(command: string, options?: ExecSyncOptions) {
  return execSync(`node ${RSBUILD_BIN_PATH} ${command}`, options);
}
