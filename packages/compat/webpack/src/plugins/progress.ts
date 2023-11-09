import { TARGET_ID_MAP, isProd } from '@rsbuild/shared';
import type { RsbuildPlugin } from '../types';

export const pluginProgress = (): RsbuildPlugin => ({
  name: 'plugin-progress',
  setup(api) {
    api.modifyWebpackChain(async (chain, { target, CHAIN_ID }) => {
      const config = api.getNormalizedConfig();
      // enable progress bar for webpack by default
      const options = config.dev.progressBar ?? true;

      if (!options) {
        return;
      }

      const { ProgressPlugin } = await import(
        '../webpackPlugins/ProgressPlugin/ProgressPlugin'
      );
      chain.plugin(CHAIN_ID.PLUGIN.PROGRESS).use(ProgressPlugin, [
        {
          id: TARGET_ID_MAP[target],
          ...(options === true ? {} : options),
        },
      ]);
    });
  },
});
