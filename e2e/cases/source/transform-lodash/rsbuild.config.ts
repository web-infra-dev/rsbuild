import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  source: {
    transformImport: [
      {
        libraryName: 'lodash',
        customName: 'lodash/{{ member }}',
      },
    ],
  },
  performance: {
    chunkSplit: {
      strategy: 'all-in-one',
    },
  },
});
