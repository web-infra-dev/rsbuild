import {
  type FileFilterUtil,
  SASS_REGEX,
  type SassLoaderOptions,
  type ToolsSassConfig,
  castArray,
  deepmerge,
  getSharedPkgCompiledPath,
  mergeChainedOptions,
  patchCompilerGlobalLocation,
} from '@rsbuild/shared';
import { getCompiledPath } from '../provider/shared';
import type { RsbuildPlugin } from '../types';

const getSassLoaderOptions = (
  rsbuildSassConfig: ToolsSassConfig | undefined,
  isUseCssSourceMap: boolean,
): {
  options: SassLoaderOptions;
  excludes: (RegExp | string)[];
} => {
  const excludes: (RegExp | string)[] = [];

  const addExcludes: FileFilterUtil = (items) => {
    excludes.push(...castArray(items));
  };

  const mergeFn = (
    defaults: SassLoaderOptions,
    userOptions: SassLoaderOptions,
  ) => {
    const getSassOptions = () => {
      if (defaults.sassOptions && userOptions.sassOptions) {
        return deepmerge<SassLoaderOptions['sassOptions']>(
          defaults.sassOptions,
          userOptions.sassOptions,
        );
      }
      return userOptions.sassOptions || defaults.sassOptions;
    };

    return {
      ...defaults,
      ...userOptions,
      sassOptions: getSassOptions(),
    };
  };

  const mergedOptions = mergeChainedOptions({
    defaults: {
      sourceMap: isUseCssSourceMap,
      implementation: getSharedPkgCompiledPath('sass'),
    },
    options: rsbuildSassConfig,
    utils: { addExcludes },
    mergeFn,
  });

  return {
    options: mergedOptions,
    excludes,
  };
};

/**
 * fix resolve-url-loader can't deal with resolve.alias config
 *
 * reference: https://github.com/bholloway/resolve-url-loader/blob/e2695cde68f325f617825e168173df92236efb93/packages/resolve-url-loader/docs/advanced-features.md
 */
const getResolveUrlJoinFn = async () => {
  const {
    createJoinFunction,
    asGenerator,
    createJoinImplementation,
    defaultJoinGenerator,
  } = await import('../../compiled/resolve-url-loader');

  const rsbuildGenerator = asGenerator((item: any, ...rest: any[]) => {
    // only handle relative path (not absolutely accurate, but can meet common scenarios)
    if (!item.uri.startsWith('.')) {
      return [null];
    }
    return defaultJoinGenerator(item, ...rest);
  });
  return createJoinFunction(
    'rsbuild-resolve-join-fn',
    createJoinImplementation(rsbuildGenerator),
  );
};

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
          .loader(getCompiledPath('resolve-url-loader'))
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
