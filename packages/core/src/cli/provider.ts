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
  // if (deps[RSPACK_PROVIDER]) {
  //   return 'rspack';
  // }
  // if (deps[WEBPACK_PROVIDER]) {
  //   return 'webpack';
  // }

  // if (isPackageInstalled(RSPACK_PROVIDER, root)) {
  //   return 'rspack';
  // }

  // throw new Error(
  //   `Failed to load builder provider, please check if you have "${RSPACK_PROVIDER}" or "${WEBPACK_PROVIDER}" installed`,
  // );
}

export async function loadProvider() {
  const { builderRspackProvider } = await import('../rspack-provider');
  return builderRspackProvider;

  // const providerType = getProviderType();

  // const { builderWebpackProvider } = await import(
  //   '@modern-js/builder-webpack-provider'
  // );
  // return builderWebpackProvider;
}
