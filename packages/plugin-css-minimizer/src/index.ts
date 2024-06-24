import type {
  ChainIdentifier,
  ConfigChain,
  RsbuildPlugin,
  Rspack,
  RspackChain,
} from '@rsbuild/core';
import { reduceConfigs } from '@rsbuild/core';
import CssMinimizerWebpackPlugin from 'css-minimizer-webpack-plugin';
import type CssMinimizerPlugin from 'css-minimizer-webpack-plugin';

export type CssMinimizerPluginOptions = CssMinimizerPlugin.BasePluginOptions &
  CssMinimizerPlugin.DefinedDefaultMinimizerAndOptions<CssMinimizerPlugin.CssNanoOptionsExtended>;

export type PluginCssMinimizerOptions = {
  /**
   * Used to customize the options of css-minimizer-webpack-plugin.
   * @see https://github.com/webpack-contrib/css-minimizer-webpack-plugin
   */
  pluginOptions?: ConfigChain<CssMinimizerPluginOptions>;
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
  chain: RspackChain,
  CHAIN_ID: ChainIdentifier,
  options: PluginCssMinimizerOptions = {},
) {
  const mergedOptions: CssMinimizerPluginOptions = reduceConfigs({
    initial: {
      minify: CssMinimizerWebpackPlugin.cssnanoMinify,
      minimizerOptions: getCssnanoDefaultOptions(),
    },
    config: options.pluginOptions,
  });

  chain.optimization
    .minimizer(CHAIN_ID.MINIMIZER.CSS)
    .use(CssMinimizerWebpackPlugin as Rspack.RspackPluginInstance, [
      mergedOptions,
    ])
    .end();
}

export const PLUGIN_CSS_MINIMIZER_NAME = 'rsbuild:css-minimizer';

export const pluginCssMinimizer = (
  options?: PluginCssMinimizerOptions,
): RsbuildPlugin => ({
  name: PLUGIN_CSS_MINIMIZER_NAME,

  setup(api) {
    api.modifyBundlerChain(async (chain, { CHAIN_ID, environment, isProd }) => {
      const config = api.getNormalizedConfig({ environment });
      const { minify } = config.output;

      if (
        isProd &&
        (minify === true || (typeof minify === 'object' && minify.css))
      ) {
        applyCSSMinimizer(chain, CHAIN_ID, options);
      }
    });
  },
});

export { CssMinimizerWebpackPlugin };
