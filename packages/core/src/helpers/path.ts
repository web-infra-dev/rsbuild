import { isAbsolute, join, relative, resolve, sep } from 'node:path';
import { COMPILED_PATH } from '../constants';

export function getAbsolutePath(base: string, filepath: string): string {
  return isAbsolute(filepath) ? filepath : join(base, filepath);
}

export function getRelativePath(base: string, filepath: string): string {
  const relativePath = relative(base, filepath);

  if (relativePath === '') {
    return `.${sep}`;
  }
  if (!relativePath.startsWith('.')) {
    return `.${sep}${relativePath}`;
  }
  return relativePath;
}

export function getCommonParentPath(paths: string[]): string {
  const uniquePaths = [...new Set(paths)];

  if (uniquePaths.length === 1) {
    return uniquePaths[0];
  }

  const [first, ...rest] = uniquePaths.map((p) => p.split(sep));
  const common: string[] = [];

  for (let i = 0; i < first.length; i++) {
    const segment = first[i];
    if (rest.every((p) => p[i] === segment)) {
      common.push(segment);
    } else {
      break;
    }
  }
  return common.join(sep);
}

export const getCompiledPath = (packageName: string): string =>
  join(COMPILED_PATH, packageName, 'index.js');

/**
 * ensure absolute file path.
 * @param base - Base path to resolve relative from.
 * @param filePath - Absolute or relative file path.
 * @returns Resolved absolute file path.
 */
export const ensureAbsolutePath = (base: string, filePath: string): string =>
  isAbsolute(filePath) ? filePath : resolve(base, filePath);

export const pathnameParse = (publicPath: string): string => {
  try {
    return publicPath ? new URL(publicPath).pathname : publicPath;
  } catch (err) {
    return publicPath;
  }
};

/** dedupe and remove nested paths */
export const dedupeNestedPaths = (paths: string[]): string[] => {
  return paths
    .sort((p1, p2) => (p2.length > p1.length ? -1 : 1))
    .reduce<string[]>((prev, curr) => {
      const isSub = prev.find((p) => curr.startsWith(p) || curr === p);
      if (isSub) {
        return prev;
      }

      return prev.concat(curr);
    }, []);
};

/**
 * Convert Windows backslash paths to posix forward slashes
 * @example
 * toPosixPath('foo\\bar') // returns 'foo/bar'
 */
export const toPosixPath = (filepath: string): string => {
  if (sep === '/') {
    return filepath;
  }
  return filepath.replace(/\\/g, '/');
};
