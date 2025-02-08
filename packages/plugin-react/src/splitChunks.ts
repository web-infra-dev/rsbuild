import type { RsbuildPluginAPI, Rspack, SplitChunks } from '@rsbuild/core';
import type { SplitReactChunkOptions } from './index.js';

const isPlainObject = (obj: unknown): obj is Record<string, any> =>
  obj !== null &&
  typeof obj === 'object' &&
  Object.prototype.toString.call(obj) === '[object Object]';

export const applySplitChunksRule = (
  api: RsbuildPluginAPI,
  options: SplitReactChunkOptions = {
    react: true,
    router: true,
  },
): void => {
  api.modifyBundlerChain((chain, { environment, isProd }) => {
    const { config } = environment;
    if (config.performance.chunkSplit.strategy !== 'split-by-experience') {
      return;
    }

    const currentConfig = chain.optimization.splitChunks.values();
    if (!isPlainObject(currentConfig)) {
      return;
    }

    const extraGroups: Record<
      string,
      Rspack.OptimizationSplitChunksCacheGroup
    > = {};

    if (options.react) {
      extraGroups.react = {
        name: 'lib-react',
        test: isProd
          ? /node_modules[\\/](?:react|react-dom|scheduler)[\\/]/
          : /node_modules[\\/](?:react|react-dom|scheduler|react-refresh|@rspack[\\/]plugin-react-refresh)[\\/]/,
        priority: 0,
      };
    }

    if (options.router) {
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
        ...(currentConfig as Exclude<SplitChunks, false>).cacheGroups,
      },
    });
  });
};
