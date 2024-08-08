import { getPublicPathFromChain } from '../helpers';
import type { Define, RsbuildPlugin } from '../types';

export const pluginDefine = (): RsbuildPlugin => ({
  name: 'rsbuild:define',

  setup(api) {
    api.modifyBundlerChain((chain, { CHAIN_ID, bundler, environment }) => {
      const { config } = environment;
      const builtinVars: Define = {
        'process.env.ASSET_PREFIX': JSON.stringify(
          getPublicPathFromChain(chain, false),
        ),
      };

      chain
        .plugin(CHAIN_ID.PLUGIN.DEFINE)
        .use(bundler.DefinePlugin, [
          { ...builtinVars, ...config.source.define },
        ]);
    });
  },
});
