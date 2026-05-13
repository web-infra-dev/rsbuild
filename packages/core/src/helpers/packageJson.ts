import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { isFileExists } from './fs';

export type PackageJson = Partial<{
  name: string;
  type: string;
  dependencies: Record<string, string>;
  optionalDependencies: Record<string, string>;
  peerDependencies: Record<string, string>;
  devDependencies: Record<string, string>;
}>;

export const readPackageJson = async (
  rootPath: string,
): Promise<PackageJson | undefined> => {
  const pkgJsonPath = join(rootPath, 'package.json');

  if (!(await isFileExists(pkgJsonPath))) {
    return undefined;
  }

  try {
    return JSON.parse(await readFile(pkgJsonPath, 'utf8')) as PackageJson;
  } catch {
    return undefined;
  }
};
