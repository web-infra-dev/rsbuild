import type { RsbuildPluginAPI } from '@rsbuild/core';
import {
  isProd,
  isPlainObject,
  createCacheGroups,
  type SplitChunks,
} from '@rsbuild/shared';
import { SplitReactChunkOptions } from 'src';

export const applySplitChunksRule = (
  api: RsbuildPluginAPI,
  options: SplitReactChunkOptions | undefined,
) => {
  api.modifyBundlerChain((chain) => {
    const config = api.getNormalizedConfig();
    const { chunkSplit } = config.performance || {};

    if (chunkSplit?.strategy !== 'split-by-experience') {
      return;
    }

    if (!options) {
      options = {
        react: true,
        router: true,
      };
    }

    const currentConfig = chain.optimization.splitChunks.values();

    if (!isPlainObject(currentConfig)) {
      return;
    }

    const extraGroups: Record<string, (string | RegExp)[]> = {};

    if (options.react !== false) {
      extraGroups.react = [
        'react',
        'react-dom',
        'scheduler',
        ...(isProd()
          ? []
          : ['react-refresh', '@pmmmwh/react-refresh-webpack-plugin']),
      ];
    }

    if (options.router !== false) {
      extraGroups.router = [
        'react-router',
        'react-router-dom',
        '@remix-run/router',
        'history',
      ];
    }

    if (!Object.keys(extraGroups).length) {
      return;
    }

    chain.optimization.splitChunks({
      ...currentConfig,
      cacheGroups: {
        ...(currentConfig as SplitChunks).cacheGroups,
        ...createCacheGroups(extraGroups),
      },
    });
  });
};
