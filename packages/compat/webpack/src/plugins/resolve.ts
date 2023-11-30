import path from 'path';
import {
  isWebTarget,
  TS_CONFIG_FILE,
  applyResolvePlugin,
  type BundlerChain,
  type RsbuildTarget,
  type RsbuildPlugin,
  type ChainIdentifier,
} from '@rsbuild/shared';

async function applyTsConfigPathsPlugin({
  chain,
  CHAIN_ID,
  cwd,
  mainFields,
  extensions,
}: {
  chain: BundlerChain;
  CHAIN_ID: ChainIdentifier;
  cwd: string;
  mainFields: (string | string[])[];
  extensions: string[];
}) {
  const { TsconfigPathsPlugin } = await import('tsconfig-paths-webpack-plugin');

  chain.resolve
    .plugin(CHAIN_ID.RESOLVE_PLUGIN.TS_CONFIG_PATHS)
    .use(TsconfigPathsPlugin, [
      {
        configFile: path.resolve(cwd, TS_CONFIG_FILE),
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
      const isTsProject = Boolean(api.context.tsconfigPath);

      chain.module
        .rule(CHAIN_ID.RULE.JS_DATA_URI)
        .resolve.set('fullySpecified', false);

      if (isTsProject && config.source.aliasStrategy === 'prefer-tsconfig') {
        await applyTsConfigPathsPlugin({
          chain,
          CHAIN_ID,
          cwd: api.context.rootPath,
          mainFields: getMainFields(chain, target),
          extensions: chain.resolve.extensions.values(),
        });
      }
    });
  },
});
