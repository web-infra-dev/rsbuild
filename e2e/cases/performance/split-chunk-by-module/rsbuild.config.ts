import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  output: {
    filenameHash: false,
  },
  performance: {
    chunkSplit: {
      strategy: 'split-by-module',
    },
  },
});
