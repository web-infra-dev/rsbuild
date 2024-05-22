import path from 'node:path';
import type { RsbuildPlugin, Rspack } from '@rsbuild/core';
import {
  type ChainedConfigWithUtils,
  type FileFilterUtil,
  castArray,
  deepmerge,
  mergeChainedOptions,
} from '@rsbuild/shared';
import type Less from 'less';

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
  lessLoaderOptions?: ChainedConfigWithUtils<
    LessLoaderOptions,
    { addExcludes: FileFilterUtil }
  >;
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
    implementation: require.resolve('less'),
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

  const mergedOptions = mergeChainedOptions({
    defaults: defaultLessLoaderOptions,
    options: userOptions,
    utils: { addExcludes },
    mergeFn,
  });

  return {
    options: mergedOptions,
    excludes,
  };
};

export function pluginLess({
  lessLoaderOptions,
}: PluginLessOptions = {}): RsbuildPlugin {
  return {
    name: 'rsbuild:less',
    setup(api) {
      api.modifyBundlerChain(async (chain, utils) => {
        const config = api.getNormalizedConfig();

        const rule = chain.module
          .rule(utils.CHAIN_ID.RULE.LESS)
          .test(/\.less$/);

        const { excludes, options } = getLessLoaderOptions(
          lessLoaderOptions,
          config.output.sourceMap.css,
          api.context.rootPath,
        );

        for (const item of excludes) {
          rule.exclude.add(item);
        }

        const { __internalHelper } = await import('@rsbuild/core');
        await __internalHelper.applyCSSRule({
          rule,
          utils,
          config,
          context: api.context,
          importLoaders: 2,
        });

        rule
          .use(utils.CHAIN_ID.USE.LESS)
          .loader(require.resolve('less-loader'))
          .options(options);
      });
    },
  };
}
