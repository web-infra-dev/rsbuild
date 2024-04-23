import type { RsbuildPlugin } from '@rsbuild/core';
import { getDistPath, isHtmlDisabled } from '@rsbuild/shared';
import { AsyncChunkRetryPlugin } from './AsyncChunkRetryPlugin';
import type { PluginAssetsRetryOptions } from './types';

export type { PluginAssetsRetryOptions };

export const pluginAssetsRetry = (
  options: PluginAssetsRetryOptions = {},
): RsbuildPlugin => ({
  name: 'rsbuild:assets-retry',
  setup(api) {
    api.modifyBundlerChain(async (chain, { CHAIN_ID, target, HtmlPlugin }) => {
      const config = api.getNormalizedConfig();

      if (!options || isHtmlDisabled(config, target)) {
        return;
      }

      const { AssetsRetryPlugin } = await import('./AssetsRetryPlugin');
      const distDir = getDistPath(config, 'js');

      // options.crossOrigin should be same as html.crossorigin by default
      if (options.crossOrigin === undefined) {
        options.crossOrigin = config.html.crossorigin;
      }

      if (options.minify === undefined) {
        const minify =
          typeof config.output.minify === 'boolean'
            ? config.output.minify
            : config.output.minify?.js ?? true;
        options.minify = minify;
      }

      chain.plugin(CHAIN_ID.PLUGIN.ASSETS_RETRY).use(AssetsRetryPlugin, [
        {
          ...options,
          distDir,
          HtmlPlugin,
        },
      ]);

      const isRspack = api.context.bundlerType === 'rspack';
      chain
        .plugin(CHAIN_ID.PLUGIN.ASYNC_CHUNK_RETRY)
        .use(AsyncChunkRetryPlugin, [{ ...options, isRspack }]);
    });
  },
});
