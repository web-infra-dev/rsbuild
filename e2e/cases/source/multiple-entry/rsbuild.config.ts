import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  source: {
    entry(entry, { target }) {
      if (target === 'web') {
        entry.index = './src/index.client.js';
      } else if (target === 'node') {
        entry.index = './src/index.server.js';
      }
      return entry;
    },
  },
  output: {
    targets: ['web', 'node'],
    filenameHash: false,
  },
});
