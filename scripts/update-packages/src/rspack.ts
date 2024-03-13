/**
 * In this script, we will find all the Rspack dependencies and update the version.
 */
import path from 'node:path';
import fs from 'fs-extra';
import { getPackages, getPackageVersion } from './utils';

async function run() {
  // eg. pnpm update-rspack 0.4.3-canary-xxx
  const rspackVersion = process.argv[2] || 'latest';
  const root = path.join(__dirname, '../../..');
  const pkgPath = path.join(root, 'package.json');
  const pkgObj = fs.readJSONSync(pkgPath, 'utf-8');

  pkgObj.devDependencies = await updateRspackVersion(
    pkgObj.devDependencies,
    rspackVersion,
  );

  fs.writeJSONSync(pkgPath, pkgObj, { spaces: 2 });

  const packages = await getPackages(root);

  for (const pkg of packages.packages) {
    const { packageJson, dir } = pkg;
    const { dependencies, devDependencies, peerDependencies } = packageJson;
    packageJson.dependencies = await updateRspackVersion(
      dependencies,
      rspackVersion,
    );
    packageJson.devDependencies = await updateRspackVersion(
      devDependencies,
      rspackVersion,
    );
    packageJson.peerDependencies = await updateRspackVersion(
      peerDependencies,
      rspackVersion,
    );
    fs.writeJSONSync(path.join(dir, 'package.json'), packageJson, {
      spaces: 2,
    });
  }
}

const versionMap = new Map();

const updateRspackVersion = async (
  dependencies?: Record<string, string>,
  rspackVersion?: string,
) => {
  if (!dependencies) {
    return dependencies;
  }
  for (const dep of Object.keys(dependencies)) {
    if (dep.startsWith('@rspack/')) {
      if (versionMap.get(dep)) {
        dependencies[dep] = `${versionMap.get(dep)}`;
      } else {
        const version = getPackageVersion(`${dep}@${rspackVersion}`);
        dependencies[dep] = `${version}`;
        versionMap.set(dep, version);
      }
    }
  }
  return dependencies;
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
