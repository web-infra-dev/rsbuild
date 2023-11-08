import { deepmerge } from '@rsbuild/shared/deepmerge';
import {
  mergeRsbuildConfig,
  type RsbuildPlugin,
  type RsbuildConfig as RsbuildRspackConfig,
} from '@rsbuild/core';
import type { RsbuildConfig as RsbuildWebpackConfig } from '@rsbuild/webpack';
import type { UniBuilderRspackConfig, UniBuilderWebpackConfig } from '../types';
import { pluginGlobalVars } from './plugins/globalVars';

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
  const { html = {}, output = {} } = rsbuildConfig;

  if (output.cssModuleLocalIdentName) {
    output.cssModules ||= {};
    output.cssModules.localIdentName = output.cssModuleLocalIdentName;
    delete output.cssModuleLocalIdentName;
  }

  const extraConfig: RsbuildRspackConfig | RsbuildWebpackConfig = {};
  extraConfig.html ||= {};

  if (html.metaByEntries) {
    extraConfig.html.meta = ({ entryName }) => html.metaByEntries![entryName];
    delete html.metaByEntries;
  }

  if (html.titleByEntries) {
    extraConfig.html.title = ({ entryName }) => html.titleByEntries![entryName];
    delete html.titleByEntries;
  }

  if (html.faviconByEntries) {
    extraConfig.html.favicon = ({ entryName }) =>
      html.faviconByEntries![entryName];
    delete html.faviconByEntries;
  }

  if (html.injectByEntries) {
    extraConfig.html.inject = ({ entryName }) =>
      html.injectByEntries![entryName];
    delete html.injectByEntries;
  }

  if (html.templateByEntries) {
    extraConfig.html.template = ({ entryName }) =>
      html.templateByEntries![entryName];
    delete html.templateByEntries;
  }

  if (html.templateParametersByEntries) {
    extraConfig.html.templateParameters = (_, { entryName }) =>
      html.templateParametersByEntries![entryName];
    delete html.templateParametersByEntries;
  }

  const rsbuildPlugins: RsbuildPlugin[] = [
    pluginGlobalVars(uniBuilderConfig.source?.globalVars),
  ];

  return {
    rsbuildConfig: mergeRsbuildConfig(rsbuildConfig, extraConfig),
    rsbuildPlugins,
  };
}
