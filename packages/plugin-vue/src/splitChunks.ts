import type { RsbuildPluginAPI, Rspack, SplitChunks } from '@rsbuild/core';
import type { SplitVueChunkOptions } from './index.js';

const isPlainObject = (obj: unknown): obj is Record<string, any> =>
  obj !== null &&
  typeof obj === 'object' &&
  Object.prototype.toString.call(obj) === '[object Object]';

export const applySplitChunksRule = (
  api: RsbuildPluginAPI,
  options: SplitVueChunkOptions = {
    vue: true,
    router: true,
  },
): void => {
  api.modifyBundlerChain((chain, { environment }) => {
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

    if (options.vue) {
      extraGroups.vue = {
        name: 'lib-vue',
        test: /node_modules[\\/](?:vue|vue-loader|@vue[\\/]shared|@vue[\\/]reactivity|@vue[\\/]runtime-dom|@vue[\\/]runtime-core)[\\/]/,
        priority: 0,
      };
    }

    if (options.router) {
      extraGroups.router = {
        name: 'lib-router',
        test: /node_modules[\\/]vue-router[\\/]/,
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
