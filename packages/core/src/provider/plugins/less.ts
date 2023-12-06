import type { RsbuildPlugin } from '../../types';
import {
  isUseCssSourceMap,
  LESS_REGEX,
  getLessLoaderOptions,
  getSharedPkgCompiledPath,
} from '@rsbuild/shared';

export function pluginLess(): RsbuildPlugin {
  return {
    name: 'rsbuild:less',
    setup(api) {
      api.modifyBundlerChain(async (chain, utils) => {
        const config = api.getNormalizedConfig();
        const { applyBaseCSSRule } = await import('./css');

        const rule = chain.module
          .rule(utils.CHAIN_ID.RULE.LESS)
          .test(LESS_REGEX);

        await applyBaseCSSRule({
          rule,
          utils,
          config,
          context: api.context,
          importLoaders: 2,
        });

        const { excludes, options } = getLessLoaderOptions(
          config.tools.less,
          isUseCssSourceMap(config),
        );

        excludes.forEach((item) => {
          rule.exclude.add(item);
        });

        await applyBaseCSSRule({
          rule,
          utils,
          config,
          context: api.context,
        });

        rule
          .use(utils.CHAIN_ID.USE.LESS)
          .loader(getSharedPkgCompiledPath('less-loader'))
          .options(options);
      });

      api.modifyRspackConfig(async (rspackConfig) => {
        const { applyCSSModuleRule } = await import('./css');
        const config = api.getNormalizedConfig();

        const rules = rspackConfig.module?.rules;

        applyCSSModuleRule(rules, LESS_REGEX, config);
      });
    },
  };
}
