import type { RsbuildPlugin } from '../types';

export const pluginEsm = (): RsbuildPlugin => ({
  name: 'rsbuild:esm',

  setup(api) {
    api.modifyBundlerChain((chain, { environment, target }) => {
      const { config } = environment;

      if (!config.output.module) {
        return;
      }

      if (target === 'web') {
        // Temporary solution to fix the issue of runtime chunk not loaded as expected.
        chain.optimization.runtimeChunk(true);
      }

      if (target === 'web-worker') {
        throw new Error(
          '[rsbuild:config] `output.module` is not supported for web-worker target.',
        );
      }

      chain.output
        .module(true)
        .chunkFormat('module')
        .chunkLoading('import')
        .workerChunkLoading('import')
        .library({
          ...chain.output.get('library'),
          type: 'module',
        });

      chain.experiments({
        ...chain.get('experiments'),
        outputModule: true,
      });
    });
  },
});
