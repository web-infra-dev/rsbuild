import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  environments: {
    web: {},
    worker: {
      source: {
        entry: {
          'double-worker': './src/double-worker.js',
          'triple-worker': './src/triple-worker.js',
        },
      },
      output: {
        target: 'web-worker',
        module: true,
        filenameHash: false,
        distPath: { js: '' },
      },
      splitChunks: {
        chunks: 'all',
        minSize: 0,
        minChunks: 2,
        name: 'shared',
      },
    },
  },
});
