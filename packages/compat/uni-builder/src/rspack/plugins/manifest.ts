import type { RsbuildPlugin, RsbuildPluginAPI } from '@rsbuild/core';
import { generateManifest } from '../../shared/manifest';

export const pluginManifest = (): RsbuildPlugin<RsbuildPluginAPI> => ({
  name: 'plugin-manifest',

  setup(api) {
    api.modifyBundlerChain(async (chain, { CHAIN_ID }) => {
      const { WebpackManifestPlugin } = await import('rspack-manifest-plugin');
      const publicPath = chain.output.get('publicPath');

      chain.plugin(CHAIN_ID.PLUGIN.MANIFEST).use(WebpackManifestPlugin, [
        {
          fileName: 'asset-manifest.json',
          publicPath,
          generate: generateManifest,
        },
      ]);
    });
  },
});
