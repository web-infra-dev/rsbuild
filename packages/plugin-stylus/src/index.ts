import { createRequire } from 'node:module';
import type { RsbuildPlugin, RspackChain } from '@rsbuild/core';
import deepmerge from 'deepmerge';
import { reduceConfigs } from 'reduce-configs';

const require = createRequire(import.meta.url);

export const PLUGIN_STYLUS_NAME = 'rsbuild:stylus';

type StylusOptions = {
  /**
   * Specify Stylus plugins to use.
   * @default []
   * @example use: ["nib"]
   */
  use?: string[];
  /**
   * Define Stylus variables or functions.
   * @default []
   * @example
   * define: [
   *   ["$development", process.env.NODE_ENV === "development"],
   *   ["rawVar", 42, true],
   * ]
   */
  define?: [string, any, boolean?][];
  /**
   * Add paths to the import lookup paths.
   * @default []
   * @example include: [path.join(__dirname, "src/styl/config")]
   */
  include?: string[];
  /**
   * Include regular CSS on `@import`.
   * @default false
   */
  includeCSS?: boolean;
  /**
   * Import the specified Stylus files/paths, can not be relative path.
   * @default []
   * @example import: ["nib", path.join(__dirname, "src/styl/mixins")],
   */
  import?: string[];
  /**
   * Resolve relative url()'s inside imported files.
   */
  resolveURL?: boolean;
  /**
   * Emits comments in the generated CSS indicating the corresponding Stylus line.
   * @default false
   */
  lineNumbers?: boolean;
  /**
   * Move `@import` and `@charset` to the top.
   * @default false
   */
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
    api.modifyBundlerChain((chain, { CHAIN_ID, environment }) => {
      const { config } = environment;

      const { sourceMap } = config.output;
      const mergedOptions = reduceConfigs({
        initial: {
          sourceMap: typeof sourceMap === 'boolean' ? sourceMap : sourceMap.css,
        },
        config: options,
        mergeFn: deepmerge,
      });

      const test = /\.styl(us)?$/;

      const rule = chain.module
        .rule(CHAIN_ID.RULE.STYLUS)
        .test(test)
        .resolve.preferRelative(true)
        .end();

      // Rsbuild < 1.3.0 does not have the raw and inline rules
      const inlineRule = CHAIN_ID.RULE.CSS_INLINE
        ? chain.module.rule(CHAIN_ID.RULE.STYLUS_INLINE).test(test)
        : null;

      // Support for importing raw Stylus files
      if (CHAIN_ID.RULE.CSS_RAW) {
        const cssRawRule = chain.module.rules.get(CHAIN_ID.RULE.CSS_RAW);
        chain.module
          .rule(CHAIN_ID.RULE.STYLUS_RAW)
          .test(test)
          .type('asset/source')
          .resourceQuery(cssRawRule.get('resourceQuery'));
      }

      // Update the normal rule and the inline rule
      const updateRules = (
        callback: (rule: RspackChain.Rule, type: 'normal' | 'inline') => void,
      ) => {
        callback(rule, 'normal');

        if (inlineRule) {
          callback(inlineRule, 'inline');
        }
      };

      updateRules((rule, type) => {
        // Copy the builtin CSS rules
        const cssRule = chain.module.rules.get(
          type === 'normal' ? CHAIN_ID.RULE.CSS : CHAIN_ID.RULE.CSS_INLINE,
        );
        rule.dependency(cssRule.get('dependency'));
        rule.sideEffects(cssRule.get('sideEffects'));
        rule.resourceQuery(cssRule.get('resourceQuery'));

        for (const id of Object.keys(cssRule.uses.entries())) {
          const loader = cssRule.uses.get(id);
          const options = loader.get('options') ?? {};
          const clonedOptions = deepmerge<Record<string, any>>({}, options);

          if (id === CHAIN_ID.USE.CSS) {
            // add stylus-loader
            clonedOptions.importLoaders += 1;
          }

          rule.use(id).loader(loader.get('loader')).options(clonedOptions);
        }

        rule
          .use(CHAIN_ID.USE.STYLUS)
          .loader(require.resolve('stylus-loader'))
          .options(mergedOptions);
      });
    });
  },
});
