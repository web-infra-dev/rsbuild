import execa from 'execa';

export async function getPackageVersion(packageName: string) {
  const args = [
    'view',
    packageName,
    'version',
    `--registry=https://registry.npmjs.org/`,
  ];
  const result = await execa('npm', args);
  return result.stdout;
}
