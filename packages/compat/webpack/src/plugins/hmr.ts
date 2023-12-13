import { isUsingHMR, type RsbuildPlugin } from '@rsbuild/shared';

export const pluginHMR = (): RsbuildPlugin => ({
  name: 'rsbuild-webpack:hmr',

  setup(api) {
    api.modifyBundlerChain((chain, utils) => {
      const config = api.getNormalizedConfig();

      if (!isUsingHMR(config, utils)) {
        return;
      }

      const { bundler, CHAIN_ID } = utils;
      chain.plugin(CHAIN_ID.PLUGIN.HMR).use(bundler.HotModuleReplacementPlugin);
    });
  },
});
