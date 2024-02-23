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
    targets: ['web', 'node'],
    filenameHash: false,
  },
});
