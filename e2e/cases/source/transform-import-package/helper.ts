import path from 'node:path';

import fse from 'fs-extra';

const fixtureFiles = {
  'package.json': `{
  "name": "fixture-package",
  "type": "commonjs"
}
`,
  'index.js': `module.exports = {
  get: 'transformImport test succeed',
  debounce: 'unused debounce should not be bundled',
};
`,
  'get.js': `module.exports = 'transformImport test succeed';
`,
};

export function copyPkgToNodeModules() {
  const nodeModules = path.resolve(import.meta.dirname, 'node_modules');
  const fixturePackage = path.resolve(nodeModules, 'fixture-package');

  fse.removeSync(fixturePackage);
  fse.ensureDirSync(fixturePackage);

  for (const [name, contents] of Object.entries(fixtureFiles)) {
    fse.writeFileSync(path.join(fixturePackage, name), contents);
  }
}
