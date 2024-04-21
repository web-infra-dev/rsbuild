import {
  type BundlerChain,
  type ChainIdentifier,
  type RsbuildPlugin,
  type RsbuildTarget,
  applyResolvePlugin,
  isWebTarget,
} from '@rsbuild/shared';

async function applyTsConfigPathsPlugin({
  chain,
  CHAIN_ID,
  mainFields,
  extensions,
  configFile,
}: {
  chain: BundlerChain;
  CHAIN_ID: ChainIdentifier;
  mainFields: (string | string[])[];
  extensions: string[];
  configFile: string;
}) {
  const { TsconfigPathsPlugin } = await import('tsconfig-paths-webpack-plugin');

  chain.resolve
    .plugin(CHAIN_ID.RESOLVE_PLUGIN.TS_CONFIG_PATHS)
    .use(TsconfigPathsPlugin, [
      {
        configFile,
        extensions,
        // https://github.com/dividab/tsconfig-paths-webpack-plugin/pull/106
        mainFields: mainFields as string[],
      },
    ]);
}

const getMainFields = (chain: BundlerChain, target: RsbuildTarget) => {
  const mainFields = chain.resolve.mainFields.values();

  if (mainFields.length) {
    return mainFields;
  }

  if (isWebTarget(target)) {
    return ['browser', 'module', 'main'];
  }

  return ['module', 'main'];
};

export const pluginResolve = (): RsbuildPlugin => ({
  name: 'rsbuild-webpack:resolve',

  setup(api) {
    applyResolvePlugin(api);

    api.modifyBundlerChain(async (chain, { CHAIN_ID, target }) => {
      const config = api.getNormalizedConfig();

      if (
        api.context.tsconfigPath &&
        config.source.aliasStrategy === 'prefer-tsconfig'
      ) {
        await applyTsConfigPathsPlugin({
          chain,
          CHAIN_ID,
          configFile: api.context.tsconfigPath,
          mainFields: getMainFields(chain, target),
          extensions: chain.resolve.extensions.values(),
        });
      }
    });
  },
});
