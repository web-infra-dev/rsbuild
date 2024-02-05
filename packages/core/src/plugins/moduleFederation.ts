import { DEFAULT_ASSET_PREFIX } from '@rsbuild/shared';
import type { RsbuildPlugin } from '../types';

export function pluginModuleFederation(): RsbuildPlugin {
  return {
    name: 'rsbuild:module-federation',

    setup(api) {
      api.modifyBundlerChain(async (chain, { CHAIN_ID, target }) => {
        const config = api.getNormalizedConfig();

        if (!config.moduleFederation?.options || target !== 'web') {
          return;
        }

        const { options } = config.moduleFederation;
        const { rspack } = await import('@rspack/core');

        chain
          .plugin(CHAIN_ID.PLUGIN.MODULE_FEDERATION)
          .use(rspack.container.ModuleFederationPlugin, [options]);

        const publicPath = chain.output.get('publicPath');

        // set the default publicPath to 'auto' to make MF work
        if (publicPath === DEFAULT_ASSET_PREFIX) {
          chain.output.set('publicPath', 'auto');
        }
      });
    },
  };
}
