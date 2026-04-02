import path from 'node:path';
import { fileURLToPath } from 'node:url';

import fse from 'fs-extra';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function copyPkgToNodeModules() {
  const nodeModules = path.resolve(__dirname, 'node_modules');
  const fixturePackage = path.resolve(nodeModules, 'fixture-package');

  fse.copySync(path.resolve(__dirname, 'fixture-package'), fixturePackage);
}
