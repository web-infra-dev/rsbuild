import { setConfig } from '@rsbuild/shared';
import type { RsbuildPlugin } from '../../types';

/**
 * Provide some temporary configurations for Rspack early transition
 */
export const pluginTransition = (): RsbuildPlugin => ({
  name: 'plugin-transition',

  setup(api) {
    process.env.RSPACK_CONFIG_VALIDATE = 'loose-silent';

    api.modifyBundlerChain(async (chain, { isProd }) => {
      if (isProd) {
        chain.optimization.chunkIds('deterministic');
      }
    });

    api.modifyRspackConfig((config) => {
      setConfig(config, 'experiments.rspackFuture.newResolver', true);
    });
  },
});
