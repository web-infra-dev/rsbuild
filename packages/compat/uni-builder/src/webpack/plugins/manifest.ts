import type { RsbuildPlugin } from '@rsbuild/webpack';
import { generateManifest } from '../../shared/manifest';

export const pluginManifest = (): RsbuildPlugin => ({
  name: 'uni-builder:manifest',

  setup(api) {
    api.modifyWebpackChain(async (chain, { CHAIN_ID }) => {
      const { WebpackManifestPlugin } = await import('webpack-manifest-plugin');
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
