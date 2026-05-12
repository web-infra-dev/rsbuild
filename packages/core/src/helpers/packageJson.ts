import fs from 'node:fs';
import { join } from 'node:path';

export type PackageJson = Partial<{
  name: string;
  type: string;
  dependencies: Record<string, string>;
  optionalDependencies: Record<string, string>;
  peerDependencies: Record<string, string>;
  devDependencies: Record<string, string>;
}>;

export const readPackageJson = (rootPath: string): PackageJson | undefined => {
  const pkgJsonPath = join(rootPath, 'package.json');

  if (!fs.existsSync(pkgJsonPath)) {
    return undefined;
  }

  try {
    return JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8')) as PackageJson;
  } catch {
    return undefined;
  }
};
