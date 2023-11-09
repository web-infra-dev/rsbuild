import { getDistPath, isHtmlDisabled } from '@rsbuild/shared';
import type { RsbuildPlugin, RsbuildPluginAPI } from '@rsbuild/core';
import type { PluginAssetsRetryOptions } from './types';

export type { PluginAssetsRetryOptions };

export const pluginAssetsRetry = (
  options: PluginAssetsRetryOptions = {},
): RsbuildPlugin<RsbuildPluginAPI> => ({
  name: 'plugin-assets-retry',
  setup(api) {
    api.modifyBundlerChain(async (chain, { CHAIN_ID, target, HtmlPlugin }) => {
      const config = api.getNormalizedConfig();

      if (!options || isHtmlDisabled(config, target)) {
        return;
      }

      const { AssetsRetryPlugin } = await import('./AssetsRetryPlugin');
      const distDir = getDistPath(config.output, 'js');

      // options.crossOrigin should be same as html.crossorigin by default
      if (options.crossOrigin === undefined) {
        options.crossOrigin = config.html.crossorigin;
      }

      chain.plugin(CHAIN_ID.PLUGIN.ASSETS_RETRY).use(AssetsRetryPlugin, [
        {
          ...options,
          distDir,
          HtmlPlugin,
        },
      ]);
    });
  },
});
