import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  output: {
    filenameHash: false,
  },
  environments: {
    web: {
      source: {
        entry: {
          index: './src/index.client.js',
        },
      },
      output: {
        target: 'web',
      },
    },
    node: {
      source: {
        entry: {
          index: './src/index.server.js',
        },
      },
      output: {
        target: 'node',
        distPath: {
          root: 'dist/server',
        },
      },
    },
  },
});
