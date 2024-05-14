import { CSS_MODULES_REGEX, NODE_MODULES_REGEX } from './constants';

export const isInNodeModules = (path: string) => NODE_MODULES_REGEX.test(path);

export type CssLoaderModules =
  | boolean
  | string
  | {
      auto: boolean | RegExp | ((filename: string) => boolean);
    };

export const isCssModules = (filename: string, modules: CssLoaderModules) => {
  if (typeof modules === 'boolean') {
    return modules;
  }

  // Same as the `mode` option
  // https://github.com/webpack-contrib/css-loader?tab=readme-ov-file#mode
  if (typeof modules === 'string') {
    // CSS Modules will be disabled if mode is 'global'
    return modules !== 'global';
  }

  const { auto } = modules;

  if (typeof auto === 'boolean') {
    return auto && CSS_MODULES_REGEX.test(filename);
  }
  if (auto instanceof RegExp) {
    return auto.test(filename);
  }
  if (typeof auto === 'function') {
    return auto(filename);
  }
  return true;
};
