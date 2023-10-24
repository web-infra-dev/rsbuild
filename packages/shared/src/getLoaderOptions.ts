import {
  ToolsSassConfig,
  ToolsLessConfig,
  FileFilterUtil,
  SassLoaderOptions,
  LessLoaderOptions,
} from './types';
import { getSharedPkgCompiledPath } from './utils';
import { mergeChainedOptions } from './mergeChainedOptions';
import _ from 'lodash';

export const getSassLoaderOptions = async (
  rsbuildSassConfig: ToolsSassConfig | undefined,
  isUseCssSourceMap: boolean,
) => {
  const excludes: (RegExp | string)[] = [];

  const addExcludes: FileFilterUtil = (items) => {
    excludes.push(..._.castArray(items));
  };

  const mergedOptions = mergeChainedOptions<
    SassLoaderOptions,
    { addExcludes: FileFilterUtil }
  >(
    {
      sourceMap: isUseCssSourceMap,
      implementation: getSharedPkgCompiledPath('sass'),
    },
    rsbuildSassConfig,
    { addExcludes },
    (defaults: SassLoaderOptions, userOptions: SassLoaderOptions) => {
      return {
        ...defaults,
        ...userOptions,
        sassOptions: _.merge(defaults.sassOptions, userOptions.sassOptions),
      };
    },
  );

  return {
    options: mergedOptions,
    excludes,
  };
};

export const getLessLoaderOptions = async (
  rsbuildLessConfig: ToolsLessConfig | undefined,
  isUseCssSourceMap: boolean,
) => {
  const excludes: (RegExp | string)[] = [];

  const addExcludes: FileFilterUtil = (items) => {
    excludes.push(..._.castArray(items));
  };

  const defaultLessLoaderOptions: LessLoaderOptions = {
    lessOptions: {
      javascriptEnabled: true,
    },
    sourceMap: isUseCssSourceMap,
    implementation: getSharedPkgCompiledPath('less'),
  };
  const mergedOptions = mergeChainedOptions(
    defaultLessLoaderOptions,
    rsbuildLessConfig,
    { addExcludes },
    (
      defaults: LessLoaderOptions,
      userOptions: LessLoaderOptions,
    ): LessLoaderOptions => {
      return {
        ...defaults,
        ...userOptions,
        lessOptions: _.merge(defaults.lessOptions, userOptions.lessOptions),
      };
    },
  );

  return {
    options: mergedOptions,
    excludes,
  };
};
