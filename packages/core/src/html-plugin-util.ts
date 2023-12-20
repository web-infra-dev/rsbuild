/**
 * This file is used to provide/set a global html-plugin singleton
 */
import HtmlWebpackPlugin from 'html-webpack-plugin';

let htmlPlugin: typeof HtmlWebpackPlugin;

export const setHtmlPlugin = (plugin: typeof HtmlWebpackPlugin) => {
  htmlPlugin = plugin;
};

export const getHtmlPlugin = () => {
  return htmlPlugin || HtmlWebpackPlugin;
};
