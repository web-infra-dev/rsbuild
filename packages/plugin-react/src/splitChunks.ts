import type { RsbuildPluginAPI } from '@rsbuild/core';
import {
  isProd,
  isPlainObject,
  createCacheGroups,
  type SplitChunks,
} from '@rsbuild/shared';

export const applySplitChunksRule = (api: RsbuildPluginAPI) => {
  api.modifyBundlerChain((chain) => {
    const config = api.getNormalizedConfig();
    const { chunkSplit } = config.performance || {};

    if (chunkSplit?.strategy !== 'split-by-experience') {
      return;
    }

    const currentConfig = chain.optimization.splitChunks.values();

    if (!isPlainObject(currentConfig)) {
      return;
    }

    const extraGroups = createCacheGroups({
      react: [
        'react',
        'react-dom',
        'scheduler',
        ...(isProd()
          ? []
          : ['react-refresh', '@pmmmwh/react-refresh-webpack-plugin']),
      ],
      router: [
        'react-router',
        'react-router-dom',
        '@remix-run/router',
        'history',
      ],
    });

    chain.optimization.splitChunks({
      ...currentConfig,
      cacheGroups: {
        ...(currentConfig as SplitChunks).cacheGroups,
        ...extraGroups,
      },
    });
  });
};
