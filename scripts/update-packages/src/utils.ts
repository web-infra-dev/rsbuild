import { execSync } from 'node:child_process';
import { getPnpmMonorepoSubProjects } from '@rsbuild/monorepo-utils';
import { readJSONSync } from 'fs-extra';
import { join } from 'node:path';

export function getPackageVersion(packageName: string) {
  const command = `npm view ${packageName} version --registry=https://registry.npmjs.org/`;
  const result = execSync(command, { encoding: 'utf-8' });
  return result.trim();
}

export async function getPackages(root: string) {
  const projects = await getPnpmMonorepoSubProjects(root);

  const packages = projects.map((project) => {
    const pkgJson = readJSONSync(join(project.dir, 'package.json'));
    return {
      packageJson: pkgJson,
      dir: project.dir,
    };
  });

  return { packages };
}
