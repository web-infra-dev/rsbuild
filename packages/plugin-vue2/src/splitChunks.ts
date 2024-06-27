import type { RsbuildPluginAPI, SplitChunks } from '@rsbuild/core';
import { createCacheGroups } from '@rsbuild/shared';
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
    const config = api.getNormalizedConfig({ environment });
    if (config.performance.chunkSplit.strategy !== 'split-by-experience') {
      return;
    }

    const currentConfig = chain.optimization.splitChunks.values();
    if (!isPlainObject(currentConfig)) {
      return;
    }

    const extraGroups: Record<string, (string | RegExp)[]> = {};

    if (options.vue) {
      extraGroups.vue = ['vue', 'vue-loader'];
    }

    if (options.router) {
      extraGroups.router = ['vue-router'];
    }

    if (!Object.keys(extraGroups).length) {
      return;
    }

    chain.optimization.splitChunks({
      ...currentConfig,
      cacheGroups: {
        ...(currentConfig as Exclude<SplitChunks, false>).cacheGroups,
        ...createCacheGroups(extraGroups),
      },
    });
  });
};
