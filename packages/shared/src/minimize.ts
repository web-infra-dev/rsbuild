import { isObject } from './utils';
import { mergeChainedOptions } from './mergeChainedOptions';
import type {
  NormalizedConfig,
  TerserPluginOptions,
  RspackBuiltinsConfig,
} from './types';

function applyRemoveConsole(
  options: TerserPluginOptions,
  config: NormalizedConfig,
) {
  if (!options.terserOptions) {
    options.terserOptions = {};
  }

  const { removeConsole } = config.performance;
  const compressOptions =
    typeof options.terserOptions.compress === 'boolean'
      ? {}
      : options.terserOptions.compress || {};

  if (removeConsole === true) {
    options.terserOptions.compress = {
      ...compressOptions,
      drop_console: true,
    };
  } else if (Array.isArray(removeConsole)) {
    const pureFuncs = removeConsole.map((method) => `console.${method}`);
    options.terserOptions.compress = {
      ...compressOptions,
      pure_funcs: pureFuncs,
    };
  }

  return options;
}

export async function getTerserMinifyOptions(config: NormalizedConfig) {
  const DEFAULT_OPTIONS: TerserPluginOptions = {
    terserOptions: {
      mangle: {
        // not need in rspack(swc)
        // https://github.com/swc-project/swc/discussions/3373
        safari10: true,
      },
      format: {
        ascii_only: config.output.charset === 'ascii',
      },
    },
  };

  switch (config.output.legalComments) {
    case 'inline':
      DEFAULT_OPTIONS.extractComments = false;
      break;
    case 'linked':
      DEFAULT_OPTIONS.extractComments = true;
      break;
    case 'none':
      DEFAULT_OPTIONS.terserOptions!.format!.comments = false;
      DEFAULT_OPTIONS.extractComments = false;
      break;
    default:
      break;
  }

  const mergedOptions = mergeChainedOptions({
    defaults: DEFAULT_OPTIONS,
    options: config.tools.terser,
  });

  const finalOptions = applyRemoveConsole(mergedOptions, config);

  return finalOptions;
}

export const getSwcMinimizerOptions = (config: NormalizedConfig) => {
  const options: RspackBuiltinsConfig['minifyOptions'] = {};

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

  return options;
};
