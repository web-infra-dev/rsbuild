/**
 * This file is used to provide/set a global html-plugin singleton
 */
import type HtmlWebpackPlugin from 'html-webpack-plugin';

let htmlPlugin: typeof HtmlWebpackPlugin;

/**
 * This method is used to override the Rsbuild default html-plugin (html-rspack-plugin).
 */
export const setHTMLPlugin = (plugin: typeof HtmlWebpackPlugin) => {
  if (plugin) {
    htmlPlugin = plugin;
  }
};

export const getHTMLPlugin = () => {
  if (!htmlPlugin) {
    htmlPlugin = require('html-webpack-plugin');
  }
  return htmlPlugin;
};
