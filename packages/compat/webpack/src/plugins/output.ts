import { posix } from 'node:path';
import {
  type RsbuildPlugin,
  applyOutputPlugin,
  getDistPath,
  getFilename,
  isUseCssExtract,
  mergeChainedOptions,
} from '@rsbuild/shared';

export const pluginOutput = (): RsbuildPlugin => ({
  name: 'rsbuild-webpack:output',

  setup(api) {
    applyOutputPlugin(api);

    api.modifyBundlerChain(async (chain, { isProd, target, CHAIN_ID }) => {
      const config = api.getNormalizedConfig();

      // css output
      if (isUseCssExtract(config, target)) {
        const { default: MiniCssExtractPlugin } = await import(
          'mini-css-extract-plugin'
        );
        const extractPluginOptions = mergeChainedOptions({
          defaults: {},
          options: config.tools.cssExtract?.pluginOptions,
        });

        const cssPath = getDistPath(config, 'css');
        const cssAsyncPath = getDistPath(config, 'cssAsync');
        const cssFilename = getFilename(config, 'css', isProd);

        chain
          .plugin(CHAIN_ID.PLUGIN.MINI_CSS_EXTRACT)
          .use(MiniCssExtractPlugin, [
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
