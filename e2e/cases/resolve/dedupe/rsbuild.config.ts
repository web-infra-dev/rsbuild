import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  performance: {
    chunkSplit: {
      strategy: 'all-in-one',
    },
  },
});
