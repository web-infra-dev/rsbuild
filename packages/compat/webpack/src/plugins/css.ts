import {
  type BundlerChainRule,
  CSS_REGEX,
  type ModifyChainUtils,
  type NormalizedConfig,
  type RsbuildContext,
  type RsbuildPlugin,
  applyCSSRule,
} from '@rsbuild/shared';

export async function applyBaseCSSRule({
  rule,
  config,
  context,
  utils,
  importLoaders = 1,
}: {
  rule: BundlerChainRule;
  config: NormalizedConfig;
  context: RsbuildContext;
  utils: ModifyChainUtils;
  importLoaders?: number;
}) {
  const { default: cssExtractPlugin } = await import('mini-css-extract-plugin');
  return applyCSSRule({
    rule,
    config,
    context,
    utils,
    importLoaders,
    cssExtractPlugin,
  });
}

export const pluginCss = (): RsbuildPlugin => {
  return {
    name: 'rsbuild-webpack:css',
    setup(api) {
      api.modifyBundlerChain(async (chain, utils) => {
        const rule = chain.module.rule(utils.CHAIN_ID.RULE.CSS);
        const config = api.getNormalizedConfig();
        rule.test(CSS_REGEX);
        await applyBaseCSSRule({
          rule,
          utils,
          config,
          context: api.context,
        });
      });
    },
  };
};
