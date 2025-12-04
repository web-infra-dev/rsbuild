import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  output: {
    manifest: true,
    filenameHash: false,
  },
  performance: {
    chunkSplit: {
      strategy: 'single-vendor',
    },
  },
});
