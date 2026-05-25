import { createRequire } from 'node:module';
import type { RsbuildPlugin, RspackChain } from '@rsbuild/core';

const require = createRequire(import.meta.url);

export const PLUGIN_TAILWINDCSS_NAME = 'rsbuild:tailwindcss';

const TAILWINDCSS_LOADER = 'tailwindcss';

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

export const pluginTailwindcss = (): RsbuildPlugin => ({
  name: PLUGIN_TAILWINDCSS_NAME,

  setup(api) {
    api.modifyBundlerChain((chain, { CHAIN_ID }) => {
      const cssMainRule = chain.module
        .rule(CHAIN_ID.RULE.CSS)
        .oneOf(CHAIN_ID.ONE_OF.CSS_MAIN);

      incrementCssImportLoaders(cssMainRule, CHAIN_ID.USE.CSS);

      cssMainRule
        .use(TAILWINDCSS_LOADER)
        .loader(require.resolve('@tailwindcss/webpack'))
        .options({
          base: api.context.rootPath,
        });
    });
  },
});
