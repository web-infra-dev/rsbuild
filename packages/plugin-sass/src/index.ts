import { join } from 'node:path';
import type { RsbuildPlugin } from '@rsbuild/core';
import {
  type FileFilterUtil,
  castArray,
  cloneDeep,
  deepmerge,
  reduceConfigsWithContext,
} from '@rsbuild/shared';
import { getResolveUrlJoinFn, patchCompilerGlobalLocation } from './helpers';
import type { PluginSassOptions, SassLoaderOptions } from './types';

export const PLUGIN_SASS_NAME = 'rsbuild:sass';

export type { PluginSassOptions };

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

  const mergedOptions = reduceConfigsWithContext({
    initial: {
      sourceMap: isUseCssSourceMap,
      api: 'modern-compiler',
      implementation: require.resolve('sass-embedded'),
    },
    config: userOptions,
    ctx: { addExcludes },
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
  name: PLUGIN_SASS_NAME,

  setup(api) {
    api.onAfterCreateCompiler(({ compiler }) => {
      patchCompilerGlobalLocation(compiler);
    });

    api.modifyBundlerChain(async (chain, { CHAIN_ID }) => {
      const { excludes, options } = getSassLoaderOptions(
        pluginOptions.sassLoaderOptions,
        // source-maps required for loaders preceding resolve-url-loader
        // otherwise the resolve-url-loader will throw an error
        true,
      );

      const rule = chain.module
        .rule(CHAIN_ID.RULE.SASS)
        .test(/\.s(?:a|c)ss$/)
        .merge({ sideEffects: true })
        .resolve.preferRelative(true)
        .end();

      for (const item of excludes) {
        rule.exclude.add(item);
      }

      if (pluginOptions.exclude) {
        rule.exclude.add(pluginOptions.exclude);
      }

      const cssRule = chain.module.rules.get(CHAIN_ID.RULE.CSS);

      // Copy the builtin CSS rules
      for (const id of Object.keys(cssRule.uses.entries())) {
        const loader = cssRule.uses.get(id);
        const options = cloneDeep(loader.get('options'));
        if (id === CHAIN_ID.USE.CSS) {
          // postcss-loader, resolve-url-loader, sass-loader
          options.importLoaders = 3;
        }
        rule.use(id).loader(loader.get('loader')).options(options);
      }

      rule
        .use(CHAIN_ID.USE.RESOLVE_URL)
        .loader(join(__dirname, '../compiled/resolve-url-loader/index.js'))
        .options({
          join: await getResolveUrlJoinFn(),
          // 'resolve-url-loader' relies on 'adjust-sourcemap-loader',
          // it has performance regression issues in some scenarios,
          // so we need to disable the sourceMap option.
          sourceMap: false,
        })
        .end()
        .use(CHAIN_ID.USE.SASS)
        .loader(join(__dirname, '../compiled/sass-loader/index.js'))
        .options(options);
    });
  },
});
