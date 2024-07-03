import type { RsbuildPlugin } from '@rsbuild/core';
import { cloneDeep, deepmerge } from '@rsbuild/shared';
import { reduceConfigs } from 'reduce-configs';

export const PLUGIN_STYLUS_NAME = 'rsbuild:stylus';

type StylusOptions = {
  use?: string[];
  include?: string;
  import?: string;
  resolveURL?: boolean;
  lineNumbers?: boolean;
  hoistAtrules?: boolean;
};

export type PluginStylusOptions = {
  /**
   * Options passed to Stylus.
   */
  stylusOptions?: StylusOptions;
  /**
   * Whether to generate Source Map.
   */
  sourceMap?: boolean;
};

export const pluginStylus = (options?: PluginStylusOptions): RsbuildPlugin => ({
  name: PLUGIN_STYLUS_NAME,

  setup(api) {
    api.modifyBundlerChain(async (chain, { CHAIN_ID, environment }) => {
      const { config } = environment;

      const mergedOptions = reduceConfigs({
        initial: {
          sourceMap: config.output.sourceMap.css,
        },
        config: options,
        mergeFn: deepmerge,
      });

      const rule = chain.module
        .rule(CHAIN_ID.RULE.STYLUS)
        .test(/\.styl(us)?$/)
        .merge({ sideEffects: true })
        .resolve.preferRelative(true)
        .end();

      const cssRule = chain.module.rules.get(CHAIN_ID.RULE.CSS);

      // Copy the builtin CSS rules
      for (const id of Object.keys(cssRule.uses.entries())) {
        const loader = cssRule.uses.get(id);
        const options = cloneDeep(loader.get('options'));
        if (id === CHAIN_ID.USE.CSS) {
          options.importLoaders = 2;
        }
        rule.use(id).loader(loader.get('loader')).options(options);
      }

      rule
        .use(CHAIN_ID.USE.STYLUS)
        .loader(require.resolve('stylus-loader'))
        .options(mergedOptions);
    });
  },
});
