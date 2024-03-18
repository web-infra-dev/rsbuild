import { isObject } from './utils';
import type {
  HTMLPluginOptions,
  NormalizedConfig,
  MinifyJSOptions,
} from './types';
import type { SwcJsMinimizerRspackPluginOptions } from '@rspack/core';
import deepmerge from '../compiled/deepmerge';

function applyRemoveConsole(
  options: MinifyJSOptions,
  config: NormalizedConfig,
) {
  const { removeConsole } = config.performance;
  const compressOptions =
    typeof options.compress === 'boolean'
      ? {}
      : options.compress || {};

  if (removeConsole === true) {
    options.compress = {
      ...compressOptions,
      drop_console: true,
    };
  } else if (Array.isArray(removeConsole)) {
    const pureFuncs = removeConsole.map((method) => `console.${method}`);
    options.compress = {
      ...compressOptions,
      pure_funcs: pureFuncs,
    };
  }

  return options;
}

export function getTerserMinifyOptions(config: NormalizedConfig) {
  const DEFAULT_OPTIONS: MinifyJSOptions = {
    mangle: {
      // not need in rspack(swc)
      // https://github.com/swc-project/swc/discussions/3373
      safari10: true,
    },
    format: {
      ascii_only: config.output.charset === 'ascii',
    },
  };

  const finalOptions = applyRemoveConsole(DEFAULT_OPTIONS, config);

  return finalOptions;
}

export const getSwcMinimizerOptions = (config: NormalizedConfig) => {
  const options: SwcJsMinimizerRspackPluginOptions = {};

  const { removeConsole } = config.performance;

  if (removeConsole === true) {
    options.compress = {
      ...(isObject(options.compress) ? options.compress : {}),
      drop_console: true,
    };
  } else if (Array.isArray(removeConsole)) {
    const pureFuncs = removeConsole.map((method) => `console.${method}`);
    options.compress = {
      ...(isObject(options.compress) ? options.compress : {}),
      pure_funcs: pureFuncs,
    };
  }

  options.format ||= {};

  switch (config.output.legalComments) {
    case 'inline':
      options.format.comments = 'some';
      options.extractComments = false;
      break;
    case 'linked':
      options.extractComments = true;
      break;
    case 'none':
      options.format.comments = false;
      options.extractComments = false;
      break;
    default:
      break;
  }

  options.format.asciiOnly = config.output.charset === 'ascii';

  const jsOptions = parseMinifyOptions(config).jsOptions;
  if (jsOptions) {
    return deepmerge(options, jsOptions);
  }

  return options;
};

export const parseMinifyOptions = (
  config: NormalizedConfig,
  isProd = true,
): {
  minifyJs: boolean;
  minifyCss: boolean;
  minifyHtml: boolean;
  jsOptions?: SwcJsMinimizerRspackPluginOptions;
  htmlOptions?: HTMLPluginOptions['minify'];
} => {
  const minify = config.output.minify;

  if (minify === false || !isProd) {
    return {
      minifyJs: false,
      minifyCss: false,
      minifyHtml: false,
      jsOptions: undefined,
      htmlOptions: undefined,
    };
  }

  if (minify === true) {
    return {
      minifyJs: true,
      minifyCss: true,
      minifyHtml: true,
      jsOptions: undefined,
      htmlOptions: undefined,
    };
  }

  return {
    minifyJs: minify.js !== false,
    minifyCss: minify.css !== false,
    minifyHtml: minify.html !== false,
    jsOptions: minify.jsOptions,
    htmlOptions: minify.htmlOptions,
  };
};
