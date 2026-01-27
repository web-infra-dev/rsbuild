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
    const CSS_MAIN = 'css';
    const CSS_INLINE = 'css-inline';
    const CSS_RAW = 'css-raw';
    const STYLUS_MAIN = 'stylus';
    const STYLUS_INLINE = 'stylus-inline';
    const STYLUS_RAW = 'stylus-raw';
    const isV1 = api.context.version.startsWith('1.');

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
      const stylusRule = chain.module
        .rule(CHAIN_ID.RULE.STYLUS)
        .test(test)
        .dependency({ not: 'url' })
        .resolve.preferRelative(true)
        .end();

      if (isV1) {
        chain.module.rule(STYLUS_RAW).test(test);
        chain.module.rule(STYLUS_INLINE).test(test);
      }

      const getRule = (id: string) => {
        // Compatibility for Rsbuild v1
        if (isV1) {
          return chain.module.rule(id);
        }
        return (
          id.startsWith('stylus')
            ? stylusRule
            : chain.module.rule(CHAIN_ID.RULE.CSS)
        ).oneOf(id);
      };

      // Inline Stylus for `?inline` imports
      const stylusInlineRule = getRule(STYLUS_INLINE);

      // Raw Stylus for `?raw` imports
      getRule(STYLUS_RAW)
        .type('asset/source')
        .resourceQuery(getRule(CSS_RAW).get('resourceQuery'));

      // Main Stylus transform
      const stylusMainRule = getRule(STYLUS_MAIN);

      // Update the main rule and the inline rule
      const updateRules = (
        callback: (
          rule: RspackChain.Rule<unknown>,
          cssBranchRule: RspackChain.Rule<unknown>,
        ) => void,
      ) => {
        callback(stylusMainRule, getRule(CSS_MAIN));
        callback(stylusInlineRule, getRule(CSS_INLINE));
      };

      updateRules((rule, cssBranchRule) => {
        // Copy the builtin CSS rules
        rule
          .sideEffects(true)
          .resourceQuery(cssBranchRule.get('resourceQuery'));

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
