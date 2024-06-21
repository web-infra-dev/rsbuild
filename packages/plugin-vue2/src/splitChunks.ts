import type { RsbuildPluginAPI, SplitChunks } from '@rsbuild/core';
import { createCacheGroups, isPlainObject } from '@rsbuild/shared';
import type { SplitVueChunkOptions } from '.';

export const applySplitChunksRule = (
  api: RsbuildPluginAPI,
  options: SplitVueChunkOptions = {
    vue: true,
    router: true,
  },
) => {
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
