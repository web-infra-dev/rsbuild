import type { RsbuildPlugin } from '@rsbuild/core';
import {
  isProd,
  mergeChainedOptions,
  getCssnanoDefaultOptions,
  type BundlerChain,
  type ChainedConfig,
  type ChainIdentifier,
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
  if (!isProd()) {
    return;
  }

  const { default: CssMinimizerPlugin } = await import(
    'css-minimizer-webpack-plugin'
  );

  const mergedOptions: CssMinimizerPluginOptions = mergeChainedOptions({
    defaults: {
      minimizerOptions: getCssnanoDefaultOptions(),
    },
    options: options.pluginOptions,
  });

  chain.optimization
    .minimizer(CHAIN_ID.MINIMIZER.CSS)
    .use(CssMinimizerPlugin, [mergedOptions])
    .end();
}

export const pluginCssMinimizer = (
  options?: PluginCssMinimizerOptions,
): RsbuildPlugin => ({
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
