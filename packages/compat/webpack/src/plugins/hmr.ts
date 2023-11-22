import type { RsbuildPlugin } from '../types';
import { isUsingHMR } from '@rsbuild/shared';

export const pluginHMR = (): RsbuildPlugin => ({
  name: 'rsbuild-webpack:hmr',

  setup(api) {
    api.modifyWebpackChain((chain, utils) => {
      const config = api.getNormalizedConfig();

      if (!isUsingHMR(config, utils)) {
        return;
      }

      const { webpack, CHAIN_ID } = utils;
      chain.plugin(CHAIN_ID.PLUGIN.HMR).use(webpack.HotModuleReplacementPlugin);
    });
  },
});
