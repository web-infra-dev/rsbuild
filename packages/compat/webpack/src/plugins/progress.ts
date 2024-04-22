import { type RsbuildPlugin, TARGET_ID_MAP } from '@rsbuild/shared';

export const pluginProgress = (): RsbuildPlugin => ({
  name: 'rsbuild-webpack:progress',
  setup(api) {
    api.modifyBundlerChain(async (chain, { target, CHAIN_ID }) => {
      const config = api.getNormalizedConfig();
      // enable progress bar for webpack by default
      const options = config.dev.progressBar ?? true;

      if (!options) {
        return;
      }

      const { ProgressPlugin } = await import('../progress/ProgressPlugin');
      chain.plugin(CHAIN_ID.PLUGIN.PROGRESS).use(ProgressPlugin, [
        {
          id: TARGET_ID_MAP[target],
          ...(options === true ? {} : options),
        },
      ]);
    });
  },
});
