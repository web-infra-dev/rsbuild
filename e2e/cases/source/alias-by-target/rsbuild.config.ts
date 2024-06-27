import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  output: {
    filenameHash: false,
  },
  environments: {
    web: {
      source: {
        alias: {
          '@common': './src/common',
        },
      },
      output: {
        target: 'web',
      },
    },
    node: {
      source: {
        alias: {
          '@common': './src/common2',
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
