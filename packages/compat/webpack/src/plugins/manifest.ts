import type { RsbuildPlugin } from '../types';
import { generateManifest } from '@rsbuild/shared';

export const pluginManifest = (): RsbuildPlugin => ({
  name: 'plugin-manifest',

  setup(api) {
    api.modifyWebpackChain(async (chain, { CHAIN_ID }) => {
      const config = api.getNormalizedConfig();

      if (!config.output.enableAssetManifest) {
        return;
      }

      const { WebpackManifestPlugin } = await import(
        '../../compiled/webpack-manifest-plugin'
      );
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
