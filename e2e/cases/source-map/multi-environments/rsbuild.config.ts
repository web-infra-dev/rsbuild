import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  output: {
    sourceMap: true,
    filenameHash: false,
  },
  performance: {
    chunkSplit: {
      strategy: 'all-in-one',
    },
  },
  environments: {
    web1: {},
    web2: {
      output: {
        distPath: 'dist/nested/web2',
      },
    },
  },
});
