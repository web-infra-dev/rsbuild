import type { SwcJsMinimizerRspackPluginOptions } from '@rspack/core';
import deepmerge from '../compiled/deepmerge';
import type {
  HTMLPluginOptions,
  MinifyJSOptions,
  NormalizedConfig,
} from './types';
import { isObject } from './utils';

function applyRemoveConsole(
  options: MinifyJSOptions,
  config: NormalizedConfig,
) {
  const { removeConsole } = config.performance;
  const compressOptions =
    typeof options.compress === 'boolean' ? {} : options.compress || {};

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

function getTerserMinifyOptions(config: NormalizedConfig) {
  const options: MinifyJSOptions = {
    mangle: {
      safari10: true,
    },
    format: {
      ascii_only: config.output.charset === 'ascii',
    },
  };

  if (config.output.legalComments === 'none') {
    options.format!.comments = false;
  }

  const finalOptions = applyRemoveConsole(options, config);
  return finalOptions;
}

export async function getHtmlMinifyOptions(
  isProd: boolean,
  config: NormalizedConfig,
) {
  if (
    !isProd ||
    !config.output.minify ||
    !parseMinifyOptions(config).minifyHtml
  ) {
    return false;
  }

  const minifyJS: MinifyJSOptions = getTerserMinifyOptions(config);

  const htmlMinifyDefaultOptions = {
    removeComments: false,
    useShortDoctype: true,
    keepClosingSlash: true,
    collapseWhitespace: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    removeEmptyAttributes: true,
    minifyJS,
    minifyCSS: true,
    minifyURLs: true,
  };

  const htmlMinifyOptions = parseMinifyOptions(config).htmlOptions;
  return typeof htmlMinifyOptions === 'object'
    ? deepmerge(htmlMinifyDefaultOptions, htmlMinifyOptions)
    : htmlMinifyDefaultOptions;
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
