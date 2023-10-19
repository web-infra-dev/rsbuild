import type { BuilderPlugin } from '../types';

/**
 * Provide some temporary configurations for Rspack early transition
 */
export const pluginTransition = (): BuilderPlugin => ({
  name: 'plugin-transition',

  setup(api) {
    process.env.RSPACK_CONFIG_VALIDATE = 'loose-silent';

    api.modifyBundlerChain(async (chain, { isProd }) => {
      if (isProd) {
        chain.optimization.chunkIds('deterministic');
      }
    });
  },
});
