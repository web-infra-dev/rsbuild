import type { RsbuildPlugin } from '@rsbuild/core';
import {
  mergeChainedOptions,
  type BundlerChain,
  type ChainedConfig,
  type ChainIdentifier,
} from '@rsbuild/shared';
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

export async function applyCSSMinimizer(
  chain: BundlerChain,
  CHAIN_ID: ChainIdentifier,
  options: PluginCssMinimizerOptions = {},
) {
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
    .use(CssMinimizerPlugin, [
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
      const isMinimize = isProd && !config.output.disableMinimize;

      if (isMinimize) {
        await applyCSSMinimizer(chain, CHAIN_ID, options);
      }
    });
  },
});
