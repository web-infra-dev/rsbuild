import { defineConfig } from '@rsbuild/core';

export default defineConfig({
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
