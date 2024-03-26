import {
  LESS_REGEX,
  getLessLoaderOptions,
  getSharedPkgCompiledPath,
  type RsbuildPlugin,
  type FileFilterUtil,
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
          api.context.rootPath,
        );
        const rule = chain.module
          .rule(utils.CHAIN_ID.RULE.LESS)
          .test(LESS_REGEX);

        for (const item of excludes) {
          rule.exclude.add(item);
        }

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
