import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  performance: {
    chunkSplit: {
      strategy: 'single-vendor',
    },
    printFileSize: {
      diff: true,
    },
  },
});
