import { isAbsolute, join, relative, sep } from 'node:path';
import { COMPILED_PATH } from '../constants';

export function toRelativePath(base: string, filepath: string): string {
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
  isAbsolute(filePath) ? filePath : join(base, filePath);

export const getPathnameFromUrl = (publicPath: string): string => {
  try {
    return publicPath ? new URL(publicPath).pathname : publicPath;
  } catch {
    return publicPath;
  }
};

/** dedupe and remove nested paths */
export const dedupeNestedPaths = (paths: string[]): string[] => {
  if (paths.length <= 1) {
    return [...paths];
  }

  // Sort paths by length (shortest first) and deduplicate
  // This ensures parent directories are processed before child directories
  const sorted = [...new Set(paths)].sort((a, b) => a.length - b.length);
  const result: string[] = [];

  for (const path of sorted) {
    let hasParent = false;

    // Only check existing results (which are all shorter or equal length)
    // Since paths are sorted by length, potential parents are already processed
    for (const existing of result) {
      if (path.startsWith(`${existing}/`)) {
        hasParent = true;
        break; // Early termination when parent is found
      }
    }

    if (!hasParent) {
      result.push(path);
    }
  }

  return result;
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
