export function getProviderType() {
  return 'rspack';

  // TODO support webpack provider
  // const root = process.cwd();
  // const pkgJsonPath = path.join(root, 'package.json');
  // const pkgJson = fs.readJSONSync(pkgJsonPath);
  // const deps = {
  //   ...pkgJson.dependencies,
  //   ...pkgJson.devDependencies,
  // };

  // // Judging based on package.json, this is more accurate
  // if (deps[WEBPACK_PROVIDER]) {
  //   return 'webpack';
  // }
}

export async function loadProvider() {
  const { builderRspackProvider } = await import('../rspack-provider');
  return builderRspackProvider;

  // const providerType = getProviderType();

  // const { builderWebpackProvider } = await import(
  //   '@rsbuild/webpack'
  // );
  // return builderWebpackProvider;
}
