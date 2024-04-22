import type { RsbuildPlugin } from '@rsbuild/core';
import {
  type BundlerChain,
  type ChainIdentifier,
  type ChainedConfig,
  mergeChainedOptions,
  parseMinifyOptions,
} from '@rsbuild/shared';
import CssMinimizerWebpackPlugin from 'css-minimizer-webpack-plugin';
import type CssMinimizerPlugin from 'css-minimizer-webpack-plugin';

export type CssMinimizerPluginOptions = CssMinimizerPlugin.BasePluginOptions &
  CssMinimizerPlugin.DefinedDefaultMinimizerAndOptions<CssMinimizerPlugin.CssNanoOptionsExtended>;

export type PluginCssMinimizerOptions = {
  /**
   * Used to customize the options of css-minimizer-webpack-plugin.
   * @see https://github.com/webpack-contrib/css-minimizer-webpack-plugin
   */
  pluginOptions?: ChainedConfig<CssMinimizerPluginOptions>;
};

type CssNanoOptions = {
  configFile?: string | undefined;
  preset?: [string, object] | string | undefined;
};

const getCssnanoDefaultOptions = (): CssNanoOptions => ({
  preset: [
    'default',
    {
      // merge longhand will break safe-area-inset-top, so disable it
      // https://github.com/cssnano/cssnano/issues/803
      // https://github.com/cssnano/cssnano/issues/967
      mergeLonghand: false,
    },
  ],
});

export function applyCSSMinimizer(
  chain: BundlerChain,
  CHAIN_ID: ChainIdentifier,
  options: PluginCssMinimizerOptions = {},
) {
  const mergedOptions: CssMinimizerPluginOptions = mergeChainedOptions({
    defaults: {
      minify: CssMinimizerWebpackPlugin.cssnanoMinify,
      minimizerOptions: getCssnanoDefaultOptions(),
    },
    options: options.pluginOptions,
  });

  chain.optimization
    .minimizer(CHAIN_ID.MINIMIZER.CSS)
    .use(CssMinimizerWebpackPlugin, [
      // @ts-expect-error type mismatch
      mergedOptions,
    ])
    .end();
}

export const pluginCssMinimizer = (
  options?: PluginCssMinimizerOptions,
): RsbuildPlugin => ({
  name: 'rsbuild:css-minimizer',

  setup(api) {
    api.modifyBundlerChain(async (chain, { CHAIN_ID, isProd }) => {
      const config = api.getNormalizedConfig();
      const isMinimize =
        isProd &&
        config.output.minify !== false &&
        parseMinifyOptions(config).minifyCss;

      if (isMinimize) {
        applyCSSMinimizer(chain, CHAIN_ID, options);
      }
    });
  },
});

export { CssMinimizerWebpackPlugin };
