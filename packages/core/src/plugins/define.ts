import {
  type Define,
  getNodeEnv,
  getPublicPathFromChain,
} from '@rsbuild/shared';
import type { RsbuildPlugin } from '../types';

export const pluginDefine = (): RsbuildPlugin => ({
  name: 'rsbuild:define',

  setup(api) {
    api.modifyBundlerChain((chain, { CHAIN_ID, bundler }) => {
      const config = api.getNormalizedConfig();
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
