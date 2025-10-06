/**
 * This file is used to get/set the global instance for html-plugin and css-extract plugin.
 */

import { requireCompiledPackage } from './helpers/vendors';
import { rspack } from './rspack';
import type { HtmlRspackPlugin } from './types';

let htmlPlugin: typeof HtmlRspackPlugin;

/**
 * This method is used to override the Rsbuild default html-plugin (html-rspack-plugin).
 */
export const setHTMLPlugin = (plugin: typeof HtmlRspackPlugin): void => {
  if (plugin) {
    htmlPlugin = plugin;
  }
};

export const getHTMLPlugin = (): typeof HtmlRspackPlugin => {
  if (!htmlPlugin) {
    htmlPlugin = requireCompiledPackage('html-rspack-plugin');
  }
  return htmlPlugin;
};

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
