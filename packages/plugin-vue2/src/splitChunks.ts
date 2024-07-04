import type { RsbuildPluginAPI, SplitChunks } from '@rsbuild/core';
import type { CacheGroups } from '@rsbuild/shared';
import type { SplitVueChunkOptions } from '.';

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

    const extraGroups: CacheGroups = {};

    if (options.router) {
      extraGroups.vue = {
        name: 'lib-vue',
        test: /[\\/]node_modules[\\/](?:vue|vue-loader)[\\/]/,
        priority: 0,
      };
    }

    if (options.router) {
      extraGroups.router = {
        name: 'lib-router',
        test: /[\\/]node_modules[\\/]vue-router[\\/]/,
        priority: 0,
      };
    }

    if (!Object.keys(extraGroups).length) {
      return;
    }

    chain.optimization.splitChunks({
      ...currentConfig,
      cacheGroups: {
        ...(currentConfig as Exclude<SplitChunks, false>).cacheGroups,
        ...extraGroups,
      },
    });
  });
};
