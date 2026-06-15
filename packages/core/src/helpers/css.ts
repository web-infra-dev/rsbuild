import type { CSSLoaderOptions } from '../types';

const CSS_MODULE_REGEX = /\.module(s)?\.\w+$/i;
const CSS_ICSS_REGEX = /\.icss\.\w+$/i;

export const isCSSModules = (
  modules: CSSLoaderOptions['modules'],
  resourcePath: string,
  resourceQuery: string,
  resourceFragment: string,
): boolean => {
  if (!modules) {
    return false;
  }

  if (modules === true || typeof modules === 'string') {
    return true;
  }

  const { auto } = modules;

  // Align with css-loader: object-form `modules` without `auto` enables CSS Modules for all files.
  if (auto === undefined) {
    return true;
  }

  if (auto === false) {
    return false;
  }

  if (auto instanceof RegExp) {
    return auto.test(resourcePath);
  }

  if (typeof auto === 'function') {
    return auto(resourcePath, resourceQuery, resourceFragment);
  }

  return CSS_MODULE_REGEX.test(resourcePath) || CSS_ICSS_REGEX.test(resourcePath);
};
