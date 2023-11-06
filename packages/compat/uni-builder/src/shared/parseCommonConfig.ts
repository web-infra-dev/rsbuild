import { deepmerge } from '@rsbuild/shared/deepmerge';
import {
  mergeRsbuildConfig,
  type RsbuildPlugin,
  type RsbuildConfig as RsbuildRspackConfig,
} from '@rsbuild/core';
import type { RsbuildConfig as RsbuildWebpackConfig } from '@rsbuild/webpack';
import type { UniBuilderRspackConfig, UniBuilderWebpackConfig } from '../types';

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
  const extraConfig: RsbuildRspackConfig | RsbuildWebpackConfig = {};
  const { html = {}, output = {} } = rsbuildConfig;

  if (output.cssModuleLocalIdentName) {
    output.cssModules ||= {};
    output.cssModules.localIdentName = output.cssModuleLocalIdentName;
    delete output.cssModuleLocalIdentName;
  }

  if (html.metaByEntries) {
    extraConfig.html ||= {};
    extraConfig.html.meta = ({ entryName }: { entryName: string }) =>
      html.metaByEntries![entryName];
    delete html.metaByEntries;
  }

  return {
    rsbuildConfig: mergeRsbuildConfig(rsbuildConfig, extraConfig),
    rsbuildPlugins: [],
  };
}
