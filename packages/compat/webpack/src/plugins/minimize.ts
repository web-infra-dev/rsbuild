import type { RsbuildPlugin } from '@rsbuild/shared';

export const pluginMinimize = (): RsbuildPlugin => ({
  name: 'rsbuild-webpack:minimize',

  setup(api) {
    api.modifyBundlerChain(async (chain, { isProd }) => {
      const config = api.getNormalizedConfig();
      const isMinimize = isProd && config.output.minify !== false;

      // set minimize to allow users to disable minimize
      chain.optimization.minimize(isMinimize);
    });
  },
});
