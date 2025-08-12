import type { RsbuildPlugin } from '../types';

export const pluginEsm = (): RsbuildPlugin => ({
  name: 'rsbuild:esm',

  setup(api) {
    api.modifyBundlerChain((chain, { environment, isServer }) => {
      const { config } = environment;

      if (!config.output.module) {
        return;
      }

      if (!isServer) {
        throw new Error(
          '[rsbuild:config] `output.module` is only supported for Node.js targets.',
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
