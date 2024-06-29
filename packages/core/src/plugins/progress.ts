import { rspack } from '@rspack/core';
import { isProd } from '../helpers';
import type { RsbuildPlugin } from '../types';

export const pluginProgress = (): RsbuildPlugin => ({
  name: 'rsbuild:progress',

  setup(api) {
    // This plugin uses Rspack builtin progress plugin and is not suitable for webpack
    if (api.context.bundlerType === 'webpack') {
      return;
    }

    api.modifyBundlerChain(async (chain, { CHAIN_ID, environment }) => {
      const { config } = environment;
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
          : environment.name;

      chain.plugin(CHAIN_ID.PLUGIN.PROGRESS).use(rspack.ProgressPlugin, [
        {
          prefix,
          ...(options === true ? {} : options),
        },
      ]);
    });
  },
});
