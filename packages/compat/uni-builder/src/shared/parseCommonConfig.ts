import { deepmerge } from '@rsbuild/shared';
import {
  mergeRsbuildConfig,
  type RsbuildPlugin,
  type RsbuildConfig as RsbuildRspackConfig,
} from '@rsbuild/core';
import type { RsbuildConfig as RsbuildWebpackConfig } from '@rsbuild/webpack';
import type { UniBuilderRspackConfig, UniBuilderWebpackConfig } from '../types';
import { pluginGlobalVars } from './plugins/globalVars';
import { pluginAssetsRetry } from '@rsbuild/plugin-assets-retry';
import { pluginRuntimeChunk } from './plugins/runtimeChunk';

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
  const { dev = {}, html = {}, output = {} } = rsbuildConfig;

  // enable progress bar by default
  if (dev.progressBar === undefined) {
    dev.progressBar = true;
  }

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

  rsbuildConfig.dev = dev;
  rsbuildConfig.html = html;
  rsbuildConfig.output = output;

  const rsbuildPlugins: RsbuildPlugin[] = [
    pluginGlobalVars(uniBuilderConfig.source?.globalVars),
  ];

  if (uniBuilderConfig.output?.assetsRetry) {
    rsbuildPlugins.push(
      pluginAssetsRetry(uniBuilderConfig.output?.assetsRetry),
    );
  }

  if (!uniBuilderConfig.output?.disableInlineRuntimeChunk) {
    rsbuildPlugins.push(pluginRuntimeChunk());
  }

  return {
    rsbuildConfig: mergeRsbuildConfig(rsbuildConfig, extraConfig),
    rsbuildPlugins,
  };
}
