import type { RsbuildPlugin } from '../../types';

import { isUsingHMR } from '@rsbuild/shared';

export const pluginHMR = (): RsbuildPlugin => ({
  name: 'rsbuild:hmr',

  setup(api) {
    api.modifyBundlerChain((chain, utils) => {
      const config = api.getNormalizedConfig();

      const usingHMR = isUsingHMR(config, utils);

      if (usingHMR) {
        chain
          .plugin(utils.CHAIN_ID.PLUGIN.HMR)
          .use(utils.bundler.HotModuleReplacementPlugin);
      }
    });
  },
});
