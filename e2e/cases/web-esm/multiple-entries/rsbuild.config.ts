import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  source: {
    entry: {
      index: './src/index',
      other: './src/other',
    },
  },
  output: {
    module: true,
  },
  splitChunks: {
    chunks: 'all',
    minSize: 0,
    cacheGroups: {
      shared: {
        test: /shared/,
        name: 'shared',
        enforce: true,
      },
    },
  },
  tools: {
    rspack: {
      optimization: {
        runtimeChunk: 'single',
      },
    },
  },
});
