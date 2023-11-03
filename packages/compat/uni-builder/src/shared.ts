import { deepmerge } from '@rsbuild/shared/deepmerge';
import type {
  RsbuildPlugin,
  RsbuildConfig as RsbuildRspackConfig,
} from '@rsbuild/core';
import type { RsbuildConfig as RsbuildWebpackConfig } from '@rsbuild/webpack';
import type { UniBuilderRspackConfig, UniBuilderWebpackConfig } from './types';

export function parseCommonConfig<B = 'rspack' | 'webpack'>(
  uniBuilderConfig: B extends 'rspack'
    ? UniBuilderRspackConfig
    : UniBuilderWebpackConfig,
): {
  rsbuildConfig: B extends 'rspack'
    ? RsbuildRspackConfig
    : RsbuildWebpackConfig;
  rsbuildPlugins: RsbuildPlugin[];
} {
  const rsbuildConfig = deepmerge({}, uniBuilderConfig);

  if (rsbuildConfig.output.cssModuleLocalIdentName) {
    rsbuildConfig.output.cssModules ||= {};
    rsbuildConfig.output.cssModules.localIdentName =
      rsbuildConfig.output.cssModuleLocalIdentName;
    delete rsbuildConfig.output.cssModuleLocalIdentName;
  }

  return {
    rsbuildConfig: rsbuildConfig,
    rsbuildPlugins: [],
  };
}
