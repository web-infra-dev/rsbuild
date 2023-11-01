import {
  mergeChainedOptions,
  getCssnanoDefaultOptions,
  type BundlerChain,
  type ChainedConfig,
  type ChainIdentifier,
  type DefaultRsbuildPlugin,
} from '@rsbuild/shared';
import type CssMinimizerPlugin from 'css-minimizer-webpack-plugin';

export type CssMinimizerPluginOptions = CssMinimizerPlugin.BasePluginOptions &
  CssMinimizerPlugin.DefinedDefaultMinimizerAndOptions<CssMinimizerPlugin.CssNanoOptionsExtended>;

export type PluginCssMinimizerOptions = {
  pluginOptions?: ChainedConfig<CssMinimizerPluginOptions>;
};

export async function applyCSSMinimizer(
  chain: BundlerChain,
  CHAIN_ID: ChainIdentifier,
  options: PluginCssMinimizerOptions = {},
) {
  const { default: CssMinimizerPlugin } = await import(
    'css-minimizer-webpack-plugin'
  );

  const mergedOptions: CssMinimizerPluginOptions = mergeChainedOptions(
    {
      minimizerOptions: getCssnanoDefaultOptions(),
    },
    options.pluginOptions,
  );

  chain.optimization
    .minimizer(CHAIN_ID.MINIMIZER.CSS)
    .use(CssMinimizerPlugin, [
      // Due to css-minimizer-webpack-plugin has changed the type of class, which using a generic type in
      // constructor, leading auto inference of parameters of plugin constructor is not possible, using any instead
      mergedOptions,
    ])
    .end();
}

export const pluginCssMinimizer = (
  options?: PluginCssMinimizerOptions,
): DefaultRsbuildPlugin => ({
  name: 'plugin-css-minimizer',

  setup(api) {
    if (api.context.bundlerType === 'webpack') {
      return;
    }

    api.modifyBundlerChain(async (chain, { CHAIN_ID }) => {
      await applyCSSMinimizer(chain, CHAIN_ID, options);
    });
  },
});
