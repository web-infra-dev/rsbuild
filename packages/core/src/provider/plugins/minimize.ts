import { CHAIN_ID, getSwcMinimizerOptions } from '@rsbuild/shared';
import type { RsbuildPlugin } from '../../types';

export const pluginMinimize = (): RsbuildPlugin => ({
  name: 'rsbuild:minimize',

  setup(api) {
    api.modifyBundlerChain(async (chain, { isProd }) => {
      const config = api.getNormalizedConfig();
      const isMinimize = isProd && !config.output.disableMinimize;

      // set minimize to allow users to disable minimize
      chain.optimization.minimize(isMinimize);

      if (!isMinimize) {
        return;
      }

      const { SwcJsMinimizerRspackPlugin, SwcCssMinimizerRspackPlugin } =
        await import('@rspack/core');

      chain.optimization
        .minimizer(CHAIN_ID.MINIMIZER.JS)
        .use(SwcJsMinimizerRspackPlugin, [getSwcMinimizerOptions(config)])
        .end()
        .minimizer(CHAIN_ID.MINIMIZER.CSS)
        .use(SwcCssMinimizerRspackPlugin, [])
        .end();
    });
  },
});
