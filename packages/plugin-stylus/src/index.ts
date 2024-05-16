import { PLUGIN_STYLUS_NAME, type RsbuildPlugin } from '@rsbuild/core';
import { deepmerge, mergeChainedOptions } from '@rsbuild/shared';

type StylusOptions = {
  use?: string[];
  include?: string;
  import?: string;
  resolveURL?: boolean;
  lineNumbers?: boolean;
  hoistAtrules?: boolean;
};

type StylusLoaderOptions = {
  /**
   * Options passed to Stylus.
   */
  stylusOptions?: StylusOptions;
  /**
   * Whether to generate Source Map.
   */
  sourceMap?: boolean;
};

export type PluginStylusOptions = StylusLoaderOptions;

export function pluginStylus(options?: PluginStylusOptions): RsbuildPlugin {
  return {
    name: PLUGIN_STYLUS_NAME,

    setup(api) {
      const STYLUS_REGEX = /\.styl(us)?$/;

      api.modifyBundlerChain(async (chain, utils) => {
        const config = api.getNormalizedConfig();

        const mergedOptions = mergeChainedOptions({
          defaults: {
            sourceMap: config.output.sourceMap.css,
          },
          options,
          mergeFn: deepmerge,
        });

        const rule = chain.module
          .rule(utils.CHAIN_ID.RULE.STYLUS)
          .test(STYLUS_REGEX);

        const { __internalHelper } = await import('@rsbuild/core');
        await __internalHelper.applyCSSRule({
          rule,
          config,
          context: api.context,
          utils,
          importLoaders: 2,
        });

        rule
          .use(utils.CHAIN_ID.USE.STYLUS)
          .loader(require.resolve('stylus-loader'))
          .options(mergedOptions);
      });
    },
  };
}
