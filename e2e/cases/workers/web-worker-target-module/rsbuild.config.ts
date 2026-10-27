import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  environments: {
    web: {},
    worker: {
      source: {
        entry: {
          worker: './src/worker.js',
        },
      },
      output: {
        target: 'web-worker',
        module: true,
        filenameHash: false,
        distPath: { js: '' },
      },
    },
  },
});
