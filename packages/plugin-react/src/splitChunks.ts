import type { RsbuildPluginAPI, Rspack } from '@rsbuild/core';
import type { SplitReactChunkOptions } from './index.js';

export const applySplitChunksRule = (
  api: RsbuildPluginAPI,
  options: SplitReactChunkOptions | boolean,
): void => {
  api.modifyBundlerChain((chain, { environment, isProd }) => {
    const { config } = environment;
    if (
      config.performance.chunkSplit.strategy !== 'split-by-experience' ||
      options === false
    ) {
      return;
    }

    const normalizedOptions =
      options === true ? { react: true, router: true } : options;

    const currentConfig =
      chain.optimization.splitChunks.values() as Rspack.Optimization['splitChunks'];
    if (typeof currentConfig !== 'object') {
      return;
    }

    const extraGroups: Record<
      string,
      Rspack.OptimizationSplitChunksCacheGroup
    > = {};

    if (normalizedOptions.react) {
      extraGroups.react = {
        name: 'lib-react',
        test: isProd
          ? /node_modules[\\/](?:react|react-dom|scheduler)[\\/]/
          : /node_modules[\\/](?:react|react-dom|scheduler|react-refresh|@rspack[\\/]plugin-react-refresh)[\\/]/,
        priority: 0,
      };
    }

    if (normalizedOptions.router) {
      extraGroups.router = {
        name: 'lib-router',
        test: /node_modules[\\/](?:react-router|react-router-dom|history|@remix-run[\\/]router)[\\/]/,
        priority: 0,
      };
    }

    if (!Object.keys(extraGroups).length) {
      return;
    }

    chain.optimization.splitChunks({
      ...currentConfig,
      cacheGroups: {
        // user defined cache groups take precedence
        ...extraGroups,
        ...currentConfig.cacheGroups,
      },
    });
  });
};
