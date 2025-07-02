import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  performance: {
    chunkSplit: {
      strategy: 'all-in-one',
    },
  },
  output: {
    filenameHash: false,
  },
  server: {
    compress: {
      filter: (req) => {
        return !req.url?.includes('index.js');
      },
    },
  },
});
