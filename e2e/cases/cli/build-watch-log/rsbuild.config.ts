import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  source: {
    entry: {
      index: './test-temp-src/index.js',
    },
  },
  output: {
    filenameHash: false,
  },
  environments: {
    web: {
      output: {
        distPath: { root: 'dist/web' },
      },
    },
    node: {
      output: {
        target: 'node',
        distPath: { root: 'dist/node' },
      },
    },
  },
});
