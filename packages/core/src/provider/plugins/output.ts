import { posix } from 'node:path';
import { applyOutputPlugin, getDistPath, getFilename } from '@rsbuild/shared';
import { rspack } from '@rspack/core';
import type { RsbuildPlugin } from '../../types';

export const pluginOutput = (): RsbuildPlugin => ({
  name: 'rsbuild:output',

  setup(api) {
    applyOutputPlugin(api);

    api.modifyBundlerChain(async (chain, { CHAIN_ID }) => {
      const config = api.getNormalizedConfig();

      if (config.output.copy) {
        const { copy } = config.output;
        const options = Array.isArray(copy) ? { patterns: copy } : copy;

        chain
          .plugin(CHAIN_ID.PLUGIN.COPY)
          .use(rspack.CopyRspackPlugin, [options]);
      }
    });

    api.modifyRspackConfig(async (rspackConfig, { isProd }) => {
      const config = api.getNormalizedConfig();
      const cssPath = getDistPath(config, 'css');
      const cssAsyncPath = getDistPath(config, 'cssAsync');
      const cssFilename = getFilename(config, 'css', isProd);

      rspackConfig.output ||= {};
      rspackConfig.output.cssFilename = posix.join(cssPath, cssFilename);
      rspackConfig.output.cssChunkFilename = posix.join(
        cssAsyncPath,
        cssFilename,
      );
    });
  },
});
