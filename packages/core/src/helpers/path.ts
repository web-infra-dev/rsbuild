import { isAbsolute, join, resolve, sep } from 'node:path';
import { COMPILED_PATH } from '../constants';

export function getCommonParentPath(paths: string[]) {
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

export const getCompiledPath = (packageName: string) =>
  join(COMPILED_PATH, packageName);

/**
 * ensure absolute file path.
 * @param base - Base path to resolve relative from.
 * @param filePath - Absolute or relative file path.
 * @returns Resolved absolute file path.
 */
export const ensureAbsolutePath = (base: string, filePath: string): string =>
  isAbsolute(filePath) ? filePath : resolve(base, filePath);
