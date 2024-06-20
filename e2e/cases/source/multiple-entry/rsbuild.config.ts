import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  source: {
    entry({ target }) {
      if (target === 'web') {
        return {
          index: './src/index.client.js',
        };
      }
      if (target === 'node') {
        return {
          index: './src/index.server.js',
        };
      }
    },
  },
  output: {
    filenameHash: false,
  },
  environments: {
    web: {
      output: {
        target: 'web',
      },
    },
    node: {
      output: {
        target: 'node',
      },
    },
  },
});
