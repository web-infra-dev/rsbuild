import { createRequire } from 'node:module';
import type { RsbuildPlugin, RspackChain } from '@rsbuild/core';

const require = createRequire(import.meta.url);

export const PLUGIN_TAILWINDCSS_NAME = 'rsbuild:tailwindcss';

export type PluginTailwindcssOptions = {
  /**
   * Enable Tailwind CSS's built-in Lightning CSS optimization.
   *
   * This overlaps with Rsbuild's built-in Lightning CSS optimization. It is
   * recommended to enable this option only when Rsbuild's built-in Lightning
   * CSS optimization is disabled.
   *
   * @default false
   */
  optimize?:
    | boolean
    | {
        /**
         * Enable minification in Tailwind CSS's built-in Lightning CSS optimization.
         * @default false
         */
        minify?: boolean;
      };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const incrementCssImportLoaders = (
  rule: RspackChain.Rule<unknown>,
  cssUseId: string,
) => {
  if (!rule.uses.has(cssUseId)) {
    return;
  }

  const cssLoader = rule.uses.get(cssUseId);
  const options = cssLoader.get('options');

  if (!isRecord(options)) {
    return;
  }

  cssLoader.options({
    ...options,
    importLoaders:
      typeof options.importLoaders === 'number' ? options.importLoaders + 1 : 1,
  });
};

export const pluginTailwindcss = (
  options: PluginTailwindcssOptions = {},
): RsbuildPlugin => ({
  name: PLUGIN_TAILWINDCSS_NAME,

  setup(api) {
    api.modifyBundlerChain((chain, { CHAIN_ID, environment, target }) => {
      if (!chain.module.rules.has(CHAIN_ID.RULE.CSS)) {
        return;
      }

      const { output } = environment.config;
      const tailwindOptions = {
        base: api.context.rootPath,
        optimize: options.optimize ?? false,
      };
      const emitCss = output.emitCss ?? target === 'web';

      const addTailwindLoader = (rule: RspackChain.Rule<unknown>) => {
        incrementCssImportLoaders(rule, CHAIN_ID.USE.CSS);

        rule
          .use('tailwindcss')
          .loader(require.resolve('@tailwindcss/webpack'))
          .options(tailwindOptions);
      };

      const cssRule = chain.module.rule(CHAIN_ID.RULE.CSS);
      addTailwindLoader(cssRule.oneOf(CHAIN_ID.ONE_OF.CSS_URL));
      if (emitCss) {
        addTailwindLoader(cssRule.oneOf(CHAIN_ID.ONE_OF.CSS_MAIN));
      }
      addTailwindLoader(cssRule.oneOf(CHAIN_ID.ONE_OF.CSS_INLINE));
    });
  },
});
