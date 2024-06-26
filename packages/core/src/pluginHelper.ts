/**
 * This file is used to get/set the global instance for html-plugin and css-extract plugin.
 */
import rspack from '@rspack/core';
import type HtmlWebpackPlugin from 'html-webpack-plugin';

let htmlPlugin: typeof HtmlWebpackPlugin;

/**
 * This method is used to override the Rsbuild default html-plugin (html-rspack-plugin).
 */
export const setHTMLPlugin = (plugin: typeof HtmlWebpackPlugin): void => {
  if (plugin) {
    htmlPlugin = plugin;
  }
};

export const getHTMLPlugin = (): typeof HtmlWebpackPlugin => {
  if (!htmlPlugin) {
    htmlPlugin = require('html-webpack-plugin');
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
