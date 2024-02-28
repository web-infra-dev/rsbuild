import {
  CHAIN_ID,
  getSwcMinimizerOptions,
  parseMinifyOptions,
} from '@rsbuild/shared';
import type { RsbuildPlugin } from '../../types';

export const pluginMinimize = (): RsbuildPlugin => ({
  name: 'rsbuild:minimize',

  setup(api) {
    api.modifyBundlerChain(async (chain, { isProd }) => {
      const config = api.getNormalizedConfig();
      const isMinimize =
        isProd && config.output.minify && !config.output.disableMinimize;

      // set minimize to allow users to disable minimize
      chain.optimization.minimize(isMinimize);

      if (!isMinimize) {
        return;
      }

      const { SwcJsMinimizerRspackPlugin, SwcCssMinimizerRspackPlugin } =
        await import('@rspack/core');

      const { minifyJs, minifyCss } = parseMinifyOptions(config);

      if (minifyJs) {
        chain.optimization
          .minimizer(CHAIN_ID.MINIMIZER.JS)
          .use(SwcJsMinimizerRspackPlugin, [getSwcMinimizerOptions(config)])
          .end();
      }

      if (minifyCss) {
        chain.optimization
          .minimizer(CHAIN_ID.MINIMIZER.CSS)
          .use(SwcCssMinimizerRspackPlugin, [])
          .end();
      }
    });
  },
});
