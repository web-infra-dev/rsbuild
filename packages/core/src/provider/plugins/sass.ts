import {
  SASS_REGEX,
  getResolveUrlJoinFn,
  getSassLoaderOptions,
  getSharedPkgCompiledPath,
  patchCompilerGlobalLocation,
} from '@rsbuild/shared';
import type { RsbuildPlugin } from '../../types';

export function pluginSass(): RsbuildPlugin {
  return {
    name: 'rsbuild:sass',
    setup(api) {
      api.onAfterCreateCompiler(({ compiler }) => {
        patchCompilerGlobalLocation(compiler);
      });

      api.modifyBundlerChain(async (chain, utils) => {
        const config = api.getNormalizedConfig();
        const { applyBaseCSSRule } = await import('./css');

        const { excludes, options } = getSassLoaderOptions(
          config.tools.sass,
          // source-maps required for loaders preceding resolve-url-loader
          // otherwise the resolve-url-loader will throw an error
          true,
        );

        const rule = chain.module
          .rule(utils.CHAIN_ID.RULE.SASS)
          .test(SASS_REGEX);

        for (const item of excludes) {
          rule.exclude.add(item);
        }

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

      api.modifyRspackConfig(async (rspackConfig) => {
        const { applyCSSModuleRule } = await import('./css');
        const config = api.getNormalizedConfig();

        const rules = rspackConfig.module?.rules;

        applyCSSModuleRule(rules, SASS_REGEX, config);
      });
    },
  };
}
