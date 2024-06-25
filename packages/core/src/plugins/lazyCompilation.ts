import type { RsbuildPlugin } from '@rsbuild/core';

export const pluginLazyCompilation = (): RsbuildPlugin => ({
  name: 'rsbuild:lazy-compilation',

  setup(api) {
    api.modifyBundlerChain((chain, { environment, isProd, target }) => {
      if (isProd || target !== 'web') {
        return;
      }

      const config = api.getNormalizedConfig({ environment });

      const options = config.dev?.lazyCompilation;
      if (!options) {
        return;
      }

      chain.experiments({
        ...chain.get('experiments'),
        lazyCompilation: options,
      });
    });
  },
});
