import {
  deepmerge,
  NODE_MODULES_REGEX,
  CSS_MODULES_REGEX,
} from '@rsbuild/shared';
import {
  mergeRsbuildConfig,
  type RsbuildPlugin,
  type RsbuildConfig as RsbuildRspackConfig,
} from '@rsbuild/core';
import type { RsbuildConfig as RsbuildWebpackConfig } from '@rsbuild/webpack';
import type { UniBuilderRspackConfig, UniBuilderWebpackConfig } from '../types';
import { pluginRem } from '@rsbuild/plugin-rem';
import { pluginAssetsRetry } from '@rsbuild/plugin-assets-retry';
import { pluginFallback } from './plugins/fallback';
import { pluginGlobalVars } from './plugins/globalVars';
import { pluginRuntimeChunk } from './plugins/runtimeChunk';
import { pluginFrameworkConfig } from './plugins/frameworkConfig';
import { pluginMainFields } from './plugins/mainFields';
import { pluginExtensionPrefix } from './plugins/extensionPrefix';
import { pluginSplitChunks } from './plugins/splitChunk';

const GLOBAL_CSS_REGEX = /\.global\.\w+$/;

/** Determine if a file path is a CSS module when disableCssModuleExtension is enabled. */
export const isLooseCssModules = (path: string) => {
  if (NODE_MODULES_REGEX.test(path)) {
    return CSS_MODULES_REGEX.test(path);
  }
  return !GLOBAL_CSS_REGEX.test(path);
};

export function parseCommonConfig<B = 'rspack' | 'webpack'>(
  uniBuilderConfig: B extends 'rspack'
    ? UniBuilderRspackConfig
    : UniBuilderWebpackConfig,
  frameworkConfigPath?: string,
): {
  rsbuildConfig: B extends 'rspack'
    ? RsbuildRspackConfig
    : RsbuildWebpackConfig;
  rsbuildPlugins: RsbuildPlugin<any>[];
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

  if (output.disableCssModuleExtension) {
    output.cssModules ||= {};
    // priority: output.cssModules.auto -> disableCssModuleExtension
    output.cssModules.auto ??= isLooseCssModules;
    delete output.cssModuleLocalIdentName;
  }

  if (uniBuilderConfig.output?.enableInlineScripts) {
    output.inlineScripts = uniBuilderConfig.output?.enableInlineScripts;
    delete output.enableInlineScripts;
  }

  if (uniBuilderConfig.output?.enableInlineStyles) {
    output.inlineStyles = uniBuilderConfig.output?.enableInlineStyles;
    delete output.enableInlineStyles;
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
    pluginSplitChunks(),
    pluginGlobalVars(uniBuilderConfig.source?.globalVars),
  ];

  if (uniBuilderConfig.source?.resolveMainFields) {
    rsbuildPlugins.push(
      pluginMainFields(uniBuilderConfig.source?.resolveMainFields),
    );
  }

  if (uniBuilderConfig.source?.resolveExtensionPrefix) {
    rsbuildPlugins.push(
      pluginExtensionPrefix(uniBuilderConfig.source?.resolveExtensionPrefix),
    );
  }

  if (uniBuilderConfig.output?.assetsRetry) {
    rsbuildPlugins.push(
      pluginAssetsRetry(uniBuilderConfig.output?.assetsRetry),
    );
  }

  const remOptions = uniBuilderConfig.output?.convertToRem;
  if (remOptions) {
    rsbuildPlugins.push(
      pluginRem(typeof remOptions === 'boolean' ? {} : remOptions),
    );
  }

  if (!uniBuilderConfig.output?.disableInlineRuntimeChunk) {
    rsbuildPlugins.push(pluginRuntimeChunk());
  }

  // Note: fallback should be the last plugin
  if (uniBuilderConfig.output?.enableAssetFallback) {
    rsbuildPlugins.push(pluginFallback());
  }

  if (frameworkConfigPath) {
    rsbuildPlugins.push(pluginFrameworkConfig(frameworkConfigPath));
  }

  return {
    rsbuildConfig: mergeRsbuildConfig(rsbuildConfig, extraConfig),
    rsbuildPlugins,
  };
}
