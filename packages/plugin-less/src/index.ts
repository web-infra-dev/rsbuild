import path from 'node:path';
import {
  type ConfigChainWithContext,
  type RsbuildPlugin,
  type Rspack,
  reduceConfigsWithContext,
} from '@rsbuild/core';
import {
  type FileFilterUtil,
  castArray,
  cloneDeep,
  deepmerge,
} from '@rsbuild/shared';
import type Less from '../compiled/less';

export const PLUGIN_LESS_NAME = 'rsbuild:less';

export type LessLoaderOptions = {
  lessOptions?: Less.Options;
  additionalData?:
    | string
    | ((
        content: string,
        loaderContext: Rspack.LoaderContext<LessLoaderOptions>,
      ) => string | Promise<string>);
  sourceMap?: boolean;
  webpackImporter?: boolean;
  implementation?: unknown;
};

export type PluginLessOptions = {
  /**
   * Options passed to less-loader.
   * @see https://github.com/webpack-contrib/less-loader
   */
  lessLoaderOptions?: ConfigChainWithContext<
    LessLoaderOptions,
    {
      /**
       * @deprecated
       * use `exclude` option instead.
       */
      addExcludes: FileFilterUtil;
    }
  >;

  /**
   * Exclude some `.less` files, they will not be transformed by less-loader.
   */
  exclude?: Rspack.RuleSetCondition;
};

const getLessLoaderOptions = (
  userOptions: PluginLessOptions['lessLoaderOptions'],
  isUseCssSourceMap: boolean,
  rootPath: string,
) => {
  const excludes: (RegExp | string)[] = [];

  const addExcludes: FileFilterUtil = (items) => {
    excludes.push(...castArray(items));
  };

  const defaultLessLoaderOptions: LessLoaderOptions = {
    lessOptions: {
      javascriptEnabled: true,
      // let less resolve from node_modules in the current root directory,
      // Avoid resolving from wrong node_modules.
      paths: [path.join(rootPath, 'node_modules')],
    },
    sourceMap: isUseCssSourceMap,
    implementation: path.join(__dirname, '../compiled/less/index.js'),
  };

  const mergeFn = (
    defaults: LessLoaderOptions,
    userOptions: LessLoaderOptions,
  ): LessLoaderOptions => {
    const getLessOptions = () => {
      if (defaults.lessOptions && userOptions.lessOptions) {
        return deepmerge(defaults.lessOptions, userOptions.lessOptions);
      }
      return userOptions.lessOptions || defaults.lessOptions;
    };

    return {
      ...defaults,
      ...userOptions,
      lessOptions: getLessOptions(),
    };
  };

  const mergedOptions = reduceConfigsWithContext({
    initial: defaultLessLoaderOptions,
    config: userOptions,
    ctx: { addExcludes },
    mergeFn,
  });

  return {
    options: mergedOptions,
    excludes,
  };
};

export const pluginLess = (
  pluginOptions: PluginLessOptions = {},
): RsbuildPlugin => ({
  name: PLUGIN_LESS_NAME,

  setup(api) {
    api.modifyBundlerChain(async (chain, { CHAIN_ID, environment }) => {
      const config = api.getNormalizedConfig({ environment });
      const rule = chain.module
        .rule(CHAIN_ID.RULE.LESS)
        .test(/\.less$/)
        .merge({ sideEffects: true })
        .resolve.preferRelative(true)
        .end();

      const { excludes, options } = getLessLoaderOptions(
        pluginOptions.lessLoaderOptions,
        config.output.sourceMap.css,
        api.context.rootPath,
      );

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
          options.importLoaders = 2;
        }
        rule.use(id).loader(loader.get('loader')).options(options);
      }

      rule
        .use(CHAIN_ID.USE.LESS)
        .loader(path.join(__dirname, '../compiled/less-loader/index.js'))
        .options(options);
    });
  },
});
