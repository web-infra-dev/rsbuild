/**
 * This file is used to provide/set a global html-plugin singleton
 */
import HtmlWebpackPlugin from 'html-webpack-plugin';

let htmlPlugin: typeof HtmlWebpackPlugin;

/**
 * This method is used to override the Rsbuild default html-plugin (html-rspack-plugin).
 */
export const setHtmlPlugin = (plugin: typeof HtmlWebpackPlugin) => {
  htmlPlugin = plugin;
};

export const getHtmlPlugin = () => {
  return htmlPlugin || HtmlWebpackPlugin;
};
