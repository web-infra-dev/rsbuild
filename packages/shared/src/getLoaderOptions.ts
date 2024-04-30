import path from 'node:path';
import { mergeChainedOptions } from './mergeChainedOptions';
import type {
  FileFilterUtil,
  LessLoaderOptions,
  SassLoaderOptions,
  ToolsLessConfig,
  ToolsSassConfig,
} from './types';
import { castArray, deepmerge, getSharedPkgCompiledPath } from './utils';

export const getSassLoaderOptions = (
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

export const getLessLoaderOptions = (
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
