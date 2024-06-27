import type { RsbuildPluginAPI, SplitChunks } from '@rsbuild/core';
import { createCacheGroups } from '@rsbuild/shared';
import type { SplitReactChunkOptions } from '.';

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

    if (options.react) {
      extraGroups.react = [
        'react',
        'react-dom',
        'scheduler',
        ...(process.env.NODE_ENV === 'production'
          ? []
          : ['react-refresh', /@rspack[\\/]plugin-react-refresh/]),
      ];
    }

    if (options.router) {
      extraGroups.router = [
        'react-router',
        'react-router-dom',
        'history',
        /@remix-run[\\/]router/,
      ];
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
