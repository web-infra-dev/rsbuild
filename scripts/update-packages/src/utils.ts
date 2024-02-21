import { execSync } from 'node:child_process';

export function getPackageVersion(packageName: string) {
  const command = `npm view ${packageName} version --registry=https://registry.npmjs.org/`;
  const result = execSync(command, { encoding: 'utf-8' });
  return result.trim();
}
