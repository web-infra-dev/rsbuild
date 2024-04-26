import { posix } from 'node:path';
import {
  applyOutputPlugin,
  getDistPath,
  getFilename,
  isUseCssExtract,
  mergeChainedOptions,
} from '@rsbuild/shared';
import { rspack } from '@rspack/core';
import { CssExtractRspackPlugin } from '@rspack/core';
import type { RsbuildPlugin } from '../../types';

export const pluginOutput = (): RsbuildPlugin => ({
  name: 'rsbuild:output',

  setup(api) {
    applyOutputPlugin(api);

    api.modifyBundlerChain(async (chain, { CHAIN_ID, target, isProd }) => {
      const config = api.getNormalizedConfig();

      if (config.output.copy) {
        const { copy } = config.output;
        const options = Array.isArray(copy) ? { patterns: copy } : copy;

        chain
          .plugin(CHAIN_ID.PLUGIN.COPY)
          .use(rspack.CopyRspackPlugin, [options]);
      }

      const cssPath = getDistPath(config, 'css');

      // css output
      if (isUseCssExtract(config, target)) {
        const extractPluginOptions = mergeChainedOptions({
          defaults: {},
          options: config.tools.cssExtract?.pluginOptions,
        });

        const cssFilename = getFilename(config, 'css', isProd);
        const cssAsyncPath = getDistPath(config, 'cssAsync');
      
        chain
          .plugin(CHAIN_ID.PLUGIN.MINI_CSS_EXTRACT)
          .use(CssExtractRspackPlugin, [
            {
              filename: posix.join(cssPath, cssFilename),
              chunkFilename: posix.join(
                cssAsyncPath,
                cssFilename,
              ),
              ignoreOrder: true,
              ...extractPluginOptions,
            },
          ]);
      }
    });
  },
});
