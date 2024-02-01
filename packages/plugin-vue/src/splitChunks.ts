import type { RsbuildPluginAPI } from '@rsbuild/core';
import {
  isPlainObject,
  createCacheGroups,
  type SplitChunks,
} from '@rsbuild/shared';
import type { SplitVueChunkOptions } from '.';

export const applySplitChunksRule = (
  api: RsbuildPluginAPI,
  options: SplitVueChunkOptions = {
    vue: true,
    router: true,
  },
) => {
  api.modifyBundlerChain((chain) => {
    const config = api.getNormalizedConfig();
    if (config.performance.chunkSplit.strategy !== 'split-by-experience') {
      return;
    }

    const currentConfig = chain.optimization.splitChunks.values();
    if (!isPlainObject(currentConfig)) {
      return;
    }

    const extraGroups: Record<string, (string | RegExp)[]> = {};

    if (options.vue) {
      extraGroups.vue = [
        'vue',
        'vue-loader',
        /@vue[\\/](shared|reactivity|runtime-dom|runtime-core)/,
      ];
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
