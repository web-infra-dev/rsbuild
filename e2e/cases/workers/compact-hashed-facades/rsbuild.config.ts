import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  output: {
    module: true,
  },
  splitChunks: {
    cacheGroups: {
      workers: {
        test: /worker\.js/,
        name: 'workers',
        enforce: true,
      },
    },
  },
  tools: {
    rspack: {
      output: {
        library: { type: 'modern-module' },
      },
      optimization: {
        runtimeChunk: 'single',
      },
    },
  },
});
