import type {
  LightningCssMinimizerRspackPluginOptions,
  SwcJsMinimizerRspackPluginOptions,
} from '@rspack/core';
import { rspack } from '@rspack/core';
import deepmerge from 'deepmerge';
import type { NormalizedEnvironmentConfig, RsbuildPlugin } from '../types';

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
  isProd: boolean,
): {
  minifyJs: boolean;
  minifyCss: boolean;
  jsOptions?: SwcJsMinimizerRspackPluginOptions;
  cssOptions?: LightningCssMinimizerRspackPluginOptions;
} => {
  const { minify } = config.output;

  if (minify === false || !isProd) {
    return {
      minifyJs: false,
      minifyCss: false,
    };
  }

  if (minify === true) {
    return {
      minifyJs: true,
      minifyCss: true,
    };
  }

  return {
    minifyJs: minify.js !== false,
    minifyCss: minify.css !== false,
    jsOptions: minify.jsOptions,
    cssOptions: minify.cssOptions,
  };
};

export const pluginMinimize = (): RsbuildPlugin => ({
  name: 'rsbuild:minimize',

  setup(api) {
    const isRspack = api.context.bundlerType === 'rspack';

    api.modifyBundlerChain(async (chain, { isProd, environment, CHAIN_ID }) => {
      const { config } = environment;
      const { minifyJs, minifyCss, jsOptions, cssOptions } = parseMinifyOptions(
        config,
        isProd,
      );

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
        const defaultOptions: LightningCssMinimizerRspackPluginOptions = {
          minimizerOptions: {
            targets: environment.browserslist,
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
