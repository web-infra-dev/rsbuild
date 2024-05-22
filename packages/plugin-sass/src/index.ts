import { join } from 'node:path';
import { type RsbuildPlugin, __internalHelper } from '@rsbuild/core';
import {
  type FileFilterUtil,
  castArray,
  deepmerge,
  mergeChainedOptions,
} from '@rsbuild/shared';
import { getResolveUrlJoinFn, patchCompilerGlobalLocation } from './helpers';
import type { PluginSassOptions, SassLoaderOptions } from './types';

const getSassLoaderOptions = (
  userOptions: PluginSassOptions['sassLoaderOptions'],
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
      api: 'modern-compiler',
      implementation: require.resolve('sass-embedded'),
    },
    options: userOptions,
    utils: { addExcludes },
    mergeFn,
  });

  return {
    options: mergedOptions,
    excludes,
  };
};

export const pluginSass = (
  pluginOptions: PluginSassOptions = {},
): RsbuildPlugin => ({
  name: 'rsbuild:sass',

  setup(api) {
    api.onAfterCreateCompiler(({ compiler }) => {
      patchCompilerGlobalLocation(compiler);
    });

    api.modifyBundlerChain(async (chain, utils) => {
      const config = api.getNormalizedConfig();

      const { excludes, options } = getSassLoaderOptions(
        pluginOptions.sassLoaderOptions,
        // source-maps required for loaders preceding resolve-url-loader
        // otherwise the resolve-url-loader will throw an error
        true,
      );

      const rule = chain.module
        .rule(utils.CHAIN_ID.RULE.SASS)
        .test(/\.s(?:a|c)ss$/);

      for (const item of excludes) {
        rule.exclude.add(item);
      }

      await __internalHelper.applyCSSRule({
        rule,
        utils,
        config,
        context: api.context,
        // postcss-loader, resolve-url-loader, sass-loader
        importLoaders: 3,
      });

      rule
        .use(utils.CHAIN_ID.USE.RESOLVE_URL)
        .loader(join(__dirname, '../compiled/resolve-url-loader/index.js'))
        .options({
          join: await getResolveUrlJoinFn(),
          // 'resolve-url-loader' relies on 'adjust-sourcemap-loader',
          // it has performance regression issues in some scenarios,
          // so we need to disable the sourceMap option.
          sourceMap: false,
        })
        .end()
        .use(utils.CHAIN_ID.USE.SASS)
        .loader(join(__dirname, '../compiled/sass-loader/index.js'))
        .options(options);
    });
  },
});
