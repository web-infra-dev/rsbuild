import {
  CSS_REGEX,
  applyCSSRule,
  type RsbuildContext,
  type RsbuildPlugin,
  type NormalizedConfig,
  type BundlerChainRule,
  type ModifyChainUtils,
} from '@rsbuild/shared';
import { CssExtractRspackPlugin } from '@rspack/core';

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
  return applyCSSRule({
    rule,
    config,
    context,
    utils,
    importLoaders,
    cssExtractPlugin: CssExtractRspackPlugin,
  });
}

export const pluginCss = (): RsbuildPlugin => {
  return {
    name: 'rsbuild:css',
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

      api.modifyRspackConfig(async (rspackConfig) => {
        rspackConfig.experiments ||= {};
        rspackConfig.experiments.css = false;
      });
    },
  };
};
