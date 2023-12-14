import {
  LESS_REGEX,
  FileFilterUtil,
  getLessLoaderOptions,
  getSharedPkgCompiledPath,
  type RsbuildPlugin,
} from '@rsbuild/shared';

export type LessLoaderUtils = {
  addExcludes: FileFilterUtil;
};

export function pluginLess(): RsbuildPlugin {
  return {
    name: 'rsbuild-webpack:less',
    setup(api) {
      api.modifyBundlerChain(async (chain, utils) => {
        const config = api.getNormalizedConfig();
        const { applyBaseCSSRule } = await import('./css');

        const { options, excludes } = getLessLoaderOptions(
          config.tools.less,
          config.output.sourceMap.css,
        );
        const rule = chain.module
          .rule(utils.CHAIN_ID.RULE.LESS)
          .test(LESS_REGEX);

        excludes.forEach((item) => {
          rule.exclude.add(item);
        });

        await applyBaseCSSRule({
          rule,
          utils,
          config,
          context: api.context,
          importLoaders: 2,
        });

        rule
          .use(utils.CHAIN_ID.USE.LESS)
          .loader(getSharedPkgCompiledPath('less-loader'))
          .options(options);
      });
    },
  };
}
