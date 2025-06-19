import type { RsbuildPlugin } from '../types';

export const pluginLazyCompilation = (): RsbuildPlugin => ({
  name: 'rsbuild:lazy-compilation',

  setup(api) {
    api.modifyBundlerChain((chain, { environment, isProd, target }) => {
      if (isProd || target !== 'web') {
        return;
      }

      const { config } = environment;

      const options = config.dev?.lazyCompilation;
      if (!options) {
        return;
      }

      if (options === true) {
        const entries = chain.entryPoints.entries() || {};

        // If there is only one entry, do not enable lazy compilation for entries
        // this can reduce the rebuild time
        if (Object.keys(entries).length <= 1) {
          chain.experiments({
            ...chain.get('experiments'),
            lazyCompilation: {
              entries: false,
              imports: true,
            },
          });
          return;
        }
      }
      chain.experiments({
        ...chain.get('experiments'),
        lazyCompilation: options,
      });
    });
  },
});
