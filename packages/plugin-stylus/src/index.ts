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

      const cssRule = chain.module.rules.get(CHAIN_ID.RULE.CSS);
      const rule = chain.module
        .rule(CHAIN_ID.RULE.STYLUS)
        .test(test)
        .dependency(cssRule.get('dependency'))
        .resolve.preferRelative(true)
        .end();
      const cssInlineRule = cssRule.oneOfs.get(CHAIN_ID.ONE_OF.CSS_INLINE);
      const cssRawRule = cssRule.oneOfs.get(CHAIN_ID.ONE_OF.CSS_RAW);

      // Inline Stylus for `?inline` imports
      const stylusInlineRule = rule
        .oneOf(CHAIN_ID.ONE_OF.STYLUS_INLINE)
        .type('javascript/auto')
        .resourceQuery(cssInlineRule.get('resourceQuery'));

      // Raw Stylus for `?raw` imports
      rule
        .oneOf(CHAIN_ID.ONE_OF.STYLUS_RAW)
        .type('asset/source')
        .resourceQuery(cssRawRule.get('resourceQuery'));

      // Main Stylus transform
      const stylusMainRule = rule
        .oneOf(CHAIN_ID.ONE_OF.STYLUS_MAIN)
        .type('javascript/auto');

      // Update the main rule and the inline rule
      const updateRules = (
        callback: (
          rule: RspackChain.Rule<RspackChain.Rule>,
          type: 'main' | 'inline',
        ) => void,
      ) => {
        callback(stylusMainRule, 'main');
        callback(stylusInlineRule, 'inline');
      };

      updateRules((rule, type) => {
        // Copy the builtin CSS rules
        const cssBranchRule =
          type === 'main'
            ? cssRule.oneOfs.get(CHAIN_ID.ONE_OF.CSS_MAIN)
            : cssInlineRule;
        rule.dependency(cssRule.get('dependency'));
        rule.sideEffects(cssBranchRule.get('sideEffects'));
        rule.resourceQuery(cssBranchRule.get('resourceQuery'));

        for (const id of Object.keys(cssBranchRule.uses.entries())) {
          const loader = cssBranchRule.uses.get(id);
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
