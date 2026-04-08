/**
 * This file is used to get the global instance for html-plugin and get/set the
 * global instance for css-extract plugin.
 */

import { rspack } from '@rspack/core';
import { requireCompiledPackage } from './helpers/vendors';
import type { HtmlRspackPlugin, NormalizedEnvironmentConfig } from './types';

let htmlPlugin: typeof HtmlRspackPlugin;

export function getHTMLPlugin(
  config?: NormalizedEnvironmentConfig,
): typeof HtmlRspackPlugin {
  if (config?.html.implementation === 'native') {
    // TODO: remove type assertion
    return rspack.HtmlRspackPlugin as unknown as typeof HtmlRspackPlugin;
  }
  if (!htmlPlugin) {
    htmlPlugin = requireCompiledPackage('html-rspack-plugin');
  }
  return htmlPlugin;
}

let cssExtractPlugin: unknown;

export const setCssExtractPlugin = (plugin: unknown): void => {
  cssExtractPlugin = plugin;
};

export const getCssExtractPlugin = (): typeof rspack.CssExtractRspackPlugin => {
  if (cssExtractPlugin) {
    return cssExtractPlugin as typeof rspack.CssExtractRspackPlugin;
  }
  return rspack.CssExtractRspackPlugin;
};
