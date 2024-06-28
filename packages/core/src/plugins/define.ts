import type { Define } from '@rsbuild/shared';
import { getNodeEnv, getPublicPathFromChain } from '../helpers';
import type { RsbuildPlugin } from '../types';

export const pluginDefine = (): RsbuildPlugin => ({
  name: 'rsbuild:define',

  setup(api) {
    api.modifyBundlerChain((chain, { CHAIN_ID, bundler, environment }) => {
      const { config } = environment;
      const builtinVars: Define = {
        'process.env.NODE_ENV': JSON.stringify(getNodeEnv()),
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
