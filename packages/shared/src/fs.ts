import path from 'node:path';
import fse from '../compiled/fs-extra';
import { promises, constants, statSync } from 'node:fs';
import type {
  RsbuildConfig,
  DistPathConfig,
  FilenameConfig,
  NormalizedConfig,
} from './types';

export { fse };

export const getDistPath = (
  config: RsbuildConfig | NormalizedConfig,
  type: keyof DistPathConfig,
): string => {
  const { distPath } = config.output || {};
  const ret = distPath?.[type];

  if (typeof ret !== 'string') {
    if (type === 'jsAsync') {
      const jsPath = getDistPath(config, 'js');
      return jsPath ? `${jsPath}/async` : 'async';
    }

    throw new Error(`unknown key ${type} in "output.distPath"`);
  }

  return ret;
};

export async function isFileExists(file: string) {
  return promises
    .access(file, constants.F_OK)
    .then(() => true)
    .catch(() => false);
}

export const isFileSync = (filePath: string) => {
  try {
    return statSync(filePath, { throwIfNoEntry: false })?.isFile();
  } catch (_) {
    return false;
  }
};

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

export const getFilename = (
  config: NormalizedConfig,
  type: keyof FilenameConfig,
  isProd: boolean,
) => {
  const { filename, filenameHash } = config.output;

  const getHash = () => {
    if (typeof filenameHash === 'string') {
      return filenameHash ? `.[${filenameHash}]` : '';
    }
    return filenameHash ? '.[contenthash:8]' : '';
  };

  const hash = getHash();

  switch (type) {
    case 'js':
      return filename.js ?? `[name]${isProd ? hash : ''}.js`;
    case 'css':
      return filename.css ?? `[name]${isProd ? hash : ''}.css`;
    case 'svg':
      return filename.svg ?? `[name]${hash}.svg`;
    case 'font':
      return filename.font ?? `[name]${hash}[ext]`;
    case 'image':
      return filename.image ?? `[name]${hash}[ext]`;
    case 'media':
      return filename.media ?? `[name]${hash}[ext]`;
    default:
      throw new Error(`unknown key ${type} in "output.filename"`);
  }
};

export async function findUp({
  filename,
  cwd = process.cwd(),
}: {
  filename: string;
  cwd?: string;
}) {
  const { root } = path.parse(cwd);

  let dir = cwd;
  while (dir && dir !== root) {
    const filePath = path.join(dir, filename);

    try {
      const stats = await promises.stat(filePath);
      if (stats?.isFile()) {
        return filePath;
      }
    } catch {}

    dir = path.dirname(dir);
  }
}

export function findUpSync({
  filename,
  cwd = process.cwd(),
}: {
  filename: string;
  cwd?: string;
}) {
  const { root } = path.parse(cwd);

  let dir = cwd;
  while (dir && dir !== root) {
    const filePath = path.join(dir, filename);

    try {
      if (isFileSync(filePath)) {
        return filePath;
      }
    } catch {}

    dir = path.dirname(dir);
  }
}
