import type {
  LightningCssMinimizerRspackPluginOptions,
  SwcJsMinimizerRspackPluginOptions,
} from '@rspack/core';
import { rspack } from '@rspack/core';
import deepmerge from 'deepmerge';
import { isPlainObject, pick } from '../helpers';
import type { NormalizedEnvironmentConfig, RsbuildPlugin } from '../types';
import { getLightningCSSLoaderOptions } from './css';

export const getSwcMinimizerOptions = (
  config: NormalizedEnvironmentConfig,
  jsOptions?: SwcJsMinimizerRspackPluginOptions,
): SwcJsMinimizerRspackPluginOptions => {
  const options: SwcJsMinimizerRspackPluginOptions = {};

  options.minimizerOptions ||= {};
  options.minimizerOptions.format ||= {};

  const { removeConsole } = config.performance;

  if (removeConsole === true) {
    options.minimizerOptions.compress = {
      drop_console: true,
    };
  } else if (Array.isArray(removeConsole)) {
    const pureFuncs = removeConsole.map((method) => `console.${method}`);
    options.minimizerOptions.compress = {
      pure_funcs: pureFuncs,
    };
  }

  switch (config.output.legalComments) {
    case 'inline':
      options.minimizerOptions.format.comments = 'some';
      options.extractComments = false;
      break;
    case 'linked':
      options.extractComments = true;
      break;
    case 'none':
      options.minimizerOptions.format.comments = false;
      options.extractComments = false;
      break;
    default:
      break;
  }

  options.minimizerOptions.format.asciiOnly = config.output.charset === 'ascii';

  if (jsOptions) {
    return deepmerge(options, jsOptions);
  }

  return options;
};

export const parseMinifyOptions = (
  config: NormalizedEnvironmentConfig,
): {
  minifyJs: boolean;
  minifyCss: boolean;
  jsOptions?: SwcJsMinimizerRspackPluginOptions;
  cssOptions?: LightningCssMinimizerRspackPluginOptions;
} => {
  const isProd = config.mode === 'production';
  const { minify } = config.output;

  if (typeof minify === 'boolean') {
    const shouldMinify = minify === true && isProd;
    return {
      minifyJs: shouldMinify,
      minifyCss: shouldMinify,
    };
  }

  return {
    minifyJs: (minify.js === true && isProd) || minify.js === 'always',
    minifyCss: (minify.css === true && isProd) || minify.css === 'always',
    jsOptions: minify.jsOptions,
    cssOptions: minify.cssOptions,
  };
};

export const pluginMinimize = (): RsbuildPlugin => ({
  name: 'rsbuild:minimize',

  setup(api) {
    const isRspack = api.context.bundlerType === 'rspack';

    api.modifyBundlerChain(async (chain, { environment, CHAIN_ID }) => {
      const { config } = environment;
      const { minifyJs, minifyCss, jsOptions, cssOptions } =
        parseMinifyOptions(config);

      chain.optimization.minimize(minifyJs || minifyCss);

      if (minifyJs && isRspack) {
        chain.optimization
          .minimizer(CHAIN_ID.MINIMIZER.JS)
          .use(rspack.SwcJsMinimizerRspackPlugin, [
            getSwcMinimizerOptions(config, jsOptions),
          ])
          .end();
      }

      if (minifyCss && isRspack) {
        const loaderOptions = getLightningCSSLoaderOptions(
          config,
          environment.browserslist,
          true,
        );

        const defaultOptions: LightningCssMinimizerRspackPluginOptions = {
          // If user has configured `tools.lightningcssLoader` options,
          // we should will use them as the default minimizer options.
          // This helps to keep development and production consistent.
          minimizerOptions: {
            targets: isPlainObject(loaderOptions.targets)
              ? environment.browserslist
              : loaderOptions.targets,
            ...pick(loaderOptions, [
              'draft',
              'include',
              'exclude',
              'nonStandard',
              'pseudoClasses',
              'unusedSymbols',
              'errorRecovery',
            ]),
          },
        };

        const mergedOptions = cssOptions
          ? deepmerge<LightningCssMinimizerRspackPluginOptions>(
              defaultOptions,
              cssOptions,
            )
          : defaultOptions;

        chain.optimization
          .minimizer(CHAIN_ID.MINIMIZER.CSS)
          .use(rspack.LightningCssMinimizerRspackPlugin, [mergedOptions])
          .end();
      }
    });
  },
});
