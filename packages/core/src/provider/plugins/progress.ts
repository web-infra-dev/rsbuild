import { TARGET_ID_MAP, isProd } from '@rsbuild/shared';
import type { RsbuildPlugin } from '../../types';

export const pluginProgress = (): RsbuildPlugin => ({
  name: 'rsbuild:progress',
  setup(api) {
    api.modifyBundlerChain(async (chain, { target, CHAIN_ID }) => {
      const config = api.getNormalizedConfig();
      const options =
        config.dev.progressBar ??
        // enable progress bar in production by default
        isProd();

      if (!options) {
        return;
      }

      const prefix =
        options !== true && options.id !== undefined
          ? options.id
          : TARGET_ID_MAP[target];

      const { ProgressPlugin } = await import('@rspack/core');
      chain.plugin(CHAIN_ID.PLUGIN.PROGRESS).use(ProgressPlugin, [
        {
          prefix,
          ...(options === true ? {} : options),
        },
      ]);
    });
  },
});
