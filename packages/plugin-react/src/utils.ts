import fs from 'fs';
import semver from '@rsbuild/shared/semver';
import { findUp } from '@rsbuild/shared';

export const isBeyondReact17 = async (cwd: string) => {
  const pkgPath = await findUp({ cwd, filename: 'package.json' });

  if (!pkgPath) {
    return false;
  }

  const pkgInfo = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const deps = {
    ...pkgInfo.devDependencies,
    ...pkgInfo.dependencies,
  };

  if (typeof deps.react !== 'string') {
    return false;
  }

  return semver.satisfies(semver.minVersion(deps.react)!, '>=17.0.0');
};
