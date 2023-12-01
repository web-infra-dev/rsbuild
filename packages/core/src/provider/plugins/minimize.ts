import {
  CHAIN_ID,
  type BundlerChain,
  type RspackBuiltinsConfig,
} from '@rsbuild/shared';
import type { RsbuildPlugin, NormalizedConfig } from '../../types';
import {
  SwcJsMinimizerRspackPlugin,
  SwcCssMinimizerRspackPlugin,
} from '@rspack/core';

export function applyJSMinimizer(
  chain: BundlerChain,
  config: NormalizedConfig,
) {
  const options: RspackBuiltinsConfig['minifyOptions'] = {};

  const { removeConsole } = config.performance;

  if (removeConsole === true) {
    options.dropConsole = true;
  } else if (Array.isArray(removeConsole)) {
    const pureFuncs = removeConsole.map((method) => `console.${method}`);
    options.pureFuncs = pureFuncs;
  }

  switch (config.output.legalComments) {
    case 'inline':
      options.comments = 'some';
      options.extractComments = false;
      break;
    case 'linked':
      options.extractComments = true;
      break;
    case 'none':
      options.comments = false;
      options.extractComments = false;
      break;
    default:
      break;
  }

  options.asciiOnly = config.output.charset === 'ascii';

  chain.optimization
    .minimizer(CHAIN_ID.MINIMIZER.JS)
    .use(SwcJsMinimizerRspackPlugin, [options])
    .end();
}

export function applyCSSMinimizer(chain: BundlerChain) {
  chain.optimization
    .minimizer(CHAIN_ID.MINIMIZER.CSS)
    .use(SwcCssMinimizerRspackPlugin, [])
    .end();
}

export const pluginMinimize = (): RsbuildPlugin => ({
  name: 'rsbuild:minimize',

  setup(api) {
    api.modifyBundlerChain((chain, { isProd }) => {
      const config = api.getNormalizedConfig();
      const isMinimize = isProd && !config.output.disableMinimize;

      // set minimize to allow users to disable minimize
      chain.optimization.minimize(isMinimize);

      if (isMinimize) {
        applyJSMinimizer(chain, config);
        applyCSSMinimizer(chain);
      }
    });
  },
});
