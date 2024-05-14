import { posix } from 'node:path';
import {
  applyOutputPlugin,
  getCssExtractPlugin,
  getDistPath,
  getFilename,
  mergeChainedOptions,
} from '@rsbuild/shared';
import { rspack } from '@rspack/core';
import type { RsbuildPlugin } from '../types';
import { isUseCssExtract } from './css';

export const pluginOutput = (): RsbuildPlugin => ({
  name: 'rsbuild:output',

  setup(api) {
    applyOutputPlugin(api);

    api.modifyBundlerChain(async (chain, { CHAIN_ID, target, isProd }) => {
      const config = api.getNormalizedConfig();

      if (config.output.copy && api.context.bundlerType === 'rspack') {
        const { copy } = config.output;
        const options = Array.isArray(copy) ? { patterns: copy } : copy;

        chain
          .plugin(CHAIN_ID.PLUGIN.COPY)
          .use(rspack.CopyRspackPlugin, [options]);
      }

      // css output
      if (isUseCssExtract(config, target)) {
        const extractPluginOptions = mergeChainedOptions({
          defaults: {},
          options: config.tools.cssExtract?.pluginOptions,
        });

        const cssPath = getDistPath(config, 'css');
        const cssFilename = getFilename(config, 'css', isProd);
        const cssAsyncPath = getDistPath(config, 'cssAsync');

        chain
          .plugin(CHAIN_ID.PLUGIN.MINI_CSS_EXTRACT)
          .use(getCssExtractPlugin(), [
            {
              filename: posix.join(cssPath, cssFilename),
              chunkFilename: posix.join(cssAsyncPath, cssFilename),
              ignoreOrder: true,
              ...extractPluginOptions,
            },
          ]);
      }
    });
  },
});
