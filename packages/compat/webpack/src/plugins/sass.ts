import {
  SASS_REGEX,
  getResolveUrlJoinFn,
  getSassLoaderOptions,
  getSharedPkgCompiledPath,
  patchCompilerGlobalLocation,
  type RsbuildPlugin,
} from '@rsbuild/shared';

export function pluginSass(): RsbuildPlugin {
  return {
    name: 'rsbuild-webpack:sass',
    setup(api) {
      api.onAfterCreateCompiler(({ compiler }) => {
        patchCompilerGlobalLocation(compiler);
      });

      api.modifyBundlerChain(async (chain, utils) => {
        const config = api.getNormalizedConfig();
        const { applyBaseCSSRule } = await import('./css');

        const { options, excludes } = getSassLoaderOptions(
          config.tools.sass,
          // source-maps required for loaders preceding resolve-url-loader
          true,
        );
        const rule = chain.module
          .rule(utils.CHAIN_ID.RULE.SASS)
          .test(SASS_REGEX);

        excludes.forEach((item) => {
          rule.exclude.add(item);
        });

        await applyBaseCSSRule({
          rule,
          utils,
          config,
          context: api.context,
          // postcss-loader, resolve-url-loader, sass-loader
          importLoaders: 3,
        });

        rule
          .use(utils.CHAIN_ID.USE.RESOLVE_URL)
          .loader(getSharedPkgCompiledPath('resolve-url-loader'))
          .options({
            join: await getResolveUrlJoinFn(),
            // 'resolve-url-loader' relies on 'adjust-sourcemap-loader',
            // it has performance regression issues in some scenarios,
            // so we need to disable the sourceMap option.
            sourceMap: false,
          })
          .end()
          .use(utils.CHAIN_ID.USE.SASS)
          .loader(getSharedPkgCompiledPath('sass-loader'))
          .options(options);
      });
    },
  };
}
