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
    },
    node: {
      source: {
        alias: {
          '@common': './src/common2',
        },
      },
      output: {
        target: 'node',
        distPath: 'dist/server',
      },
    },
  },
});
