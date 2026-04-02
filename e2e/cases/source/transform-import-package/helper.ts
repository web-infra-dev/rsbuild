import fs from 'node:fs';
import path from 'node:path';
import fse from 'fs-extra';

export function copyPkgToNodeModules() {
  const nodeModules = path.resolve(import.meta.dirname, 'node_modules');
  const fixturePackage = path.resolve(nodeModules, 'fixture-package');

  fse.ensureDirSync(nodeModules);
  fse.removeSync(fixturePackage);
  fs.cpSync(
    path.resolve(import.meta.dirname, 'fixture-package'),
    fixturePackage,
    {
      recursive: true,
    },
  );
}
