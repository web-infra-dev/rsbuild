import { mapValues } from 'lodash';
import {
  removeTailSlash,
  mergeChainedOptions,
  type GlobalVars,
  type DefaultRsbuildPlugin,
} from '@rsbuild/shared';

export const pluginDefine = (): DefaultRsbuildPlugin => ({
  name: 'plugin-define',

  async setup(api) {
    api.modifyBundlerChain(
      async (chain, { env, target, CHAIN_ID, bundler }) => {
        const config = api.getNormalizedConfig();
        const publicPath = chain.output.get('publicPath');
        const assetPrefix =
          publicPath && typeof publicPath === 'string'
            ? publicPath
            : config.output.assetPrefix;

        const builtinVars: GlobalVars = {
          'process.env.NODE_ENV': process.env.NODE_ENV,
          'process.env.ASSET_PREFIX': removeTailSlash(assetPrefix),
        };
        // Serialize global vars. User can customize value of `builtinVars`.
        const globalVars = mergeChainedOptions(
          builtinVars,
          config.source.globalVars,
          { env, target },
        );

        const serializedVars = mapValues(
          globalVars,
          (value) => JSON.stringify(value) ?? 'undefined',
        );
        // Macro defines.
        // @ts-expect-error
        const defineExprs = config.source.define;

        chain
          .plugin(CHAIN_ID.PLUGIN.DEFINE)
          .use(bundler.DefinePlugin, [{ ...serializedVars, ...defineExprs }]);
      },
    );
  },
});
