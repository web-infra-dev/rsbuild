import fs from 'node:fs';
import path from 'node:path';
import { logger } from '../logger';
import type { Rspack } from '../types';

export const isFileSync = (filePath: string): boolean | undefined => {
  try {
    return fs.statSync(filePath, { throwIfNoEntry: false })?.isFile();
  } catch (_) {
    return false;
  }
};

export function isEmptyDir(path: string): boolean {
  const files = fs.readdirSync(path);
  return files.length === 0 || (files.length === 1 && files[0] === '.git');
}

/**
 * Find first already exists file.
 * @param files - Absolute file paths with extension.
 * @returns The file path if exists, or false if no file exists.
 */
export const findExists = (files: string[]): string | false => {
  for (const file of files) {
    if (isFileSync(file)) {
      return file;
    }
  }
  return false;
};

export async function pathExists(path: string): Promise<boolean> {
  return fs.promises
    .access(path)
    .then(() => true)
    .catch(() => false);
}

export async function isFileExists(file: string): Promise<boolean> {
  return fs.promises
    .access(file, fs.constants.F_OK)
    .then(() => true)
    .catch(() => false);
}

export async function fileExistsByCompilation(
  compilation: Rspack.Compilation,
  filePath: string,
): Promise<boolean> {
  return new Promise((resolve) => {
    // TODO remove any in next Rspack release
    compilation.inputFileSystem.stat(filePath, (err: any, stats: any) => {
      if (err) {
        resolve(false);
      } else {
        resolve(stats.isFile());
      }
    });
  });
}

export async function emptyDir(dir: string): Promise<void> {
  if (!(await pathExists(dir))) {
    return;
  }

  try {
    for (const file of await fs.promises.readdir(dir)) {
      await fs.promises.rm(path.resolve(dir, file), {
        recursive: true,
        force: true,
      });
    }
  } catch (err) {
    logger.debug(`Failed to empty dir: ${dir}`);
    logger.debug(err);
  }
}
