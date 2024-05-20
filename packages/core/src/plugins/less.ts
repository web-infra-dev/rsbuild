import path from 'node:path';
import {
  type FileFilterUtil,
  type LessLoaderOptions,
  type ToolsLessConfig,
  castArray,
  deepmerge,
  getSharedPkgCompiledPath,
  mergeChainedOptions,
} from '@rsbuild/shared';
import { getCompiledPath } from '../helpers';
import type { RsbuildPlugin } from '../types';

const getLessLoaderOptions = (
  rsbuildLessConfig: ToolsLessConfig | undefined,
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
    implementation: getSharedPkgCompiledPath('less'),
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
    options: rsbuildLessConfig,
    utils: { addExcludes },
    mergeFn,
  });

  return {
    options: mergedOptions,
    excludes,
  };
};

export function pluginLess(): RsbuildPlugin {
  return {
    name: 'rsbuild:less',
    setup(api) {
      api.modifyBundlerChain(async (chain, utils) => {
        const config = api.getNormalizedConfig();
        const { applyCSSRule } = await import('./css');

        const rule = chain.module
          .rule(utils.CHAIN_ID.RULE.LESS)
          .test(/\.less$/);

        const { excludes, options } = getLessLoaderOptions(
          config.tools.less,
          config.output.sourceMap.css,
          api.context.rootPath,
        );

        for (const item of excludes) {
          rule.exclude.add(item);
        }

        await applyCSSRule({
          rule,
          utils,
          config,
          context: api.context,
          importLoaders: 2,
        });

        rule
          .use(utils.CHAIN_ID.USE.LESS)
          .loader(getCompiledPath('less-loader'))
          .options(options);
      });
    },
  };
}
