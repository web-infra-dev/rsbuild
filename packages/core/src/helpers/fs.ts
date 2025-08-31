import fs from 'node:fs';
import path from 'node:path';
import { logger } from '../logger';
import type { Rspack } from '../types';
import { toPosixPath } from './path';

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
  { inputFileSystem }: Rspack.Compilation,
  filePath: string,
): Promise<boolean> {
  return new Promise((resolve) => {
    if (!inputFileSystem) {
      resolve(false);
      return;
    }
    inputFileSystem.stat(filePath, (err, stats) => {
      if (err) {
        resolve(false);
      } else {
        resolve(Boolean(stats?.isFile()));
      }
    });
  });
}

export async function emptyDir(
  dir: string,
  keep: RegExp[] = [],
  checkExists = true,
): Promise<void> {
  if (checkExists && !(await pathExists(dir))) {
    return;
  }

  try {
    const entries = await fs.promises.readdir(dir, {
      withFileTypes: true,
    });

    await Promise.all(
      entries.map(async (entry) => {
        const fullPath = path.join(dir, entry.name);
        if (keep.some((reg) => reg.test(toPosixPath(fullPath)))) {
          return;
        }

        if (entry.isDirectory()) {
          await emptyDir(fullPath, keep, false);
          // Try to remove the directory if it's empty after recursive cleanup
          try {
            await fs.promises.rmdir(fullPath);
          } catch {
            // Directory is not empty or cannot be removed, that's fine
          }
        } else {
          await fs.promises.unlink(fullPath);
        }
      }),
    );
  } catch (err) {
    logger.debug(`failed to empty dir: ${dir}`);
    logger.debug(err);
  }
}
