import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

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

  try {
    return JSON.parse(await readFile(pkgJsonPath, 'utf8')) as PackageJson;
  } catch {
    return undefined;
  }
};
