import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  output: {
    filenameHash: false,
    targets: ['web', 'node'],
    emitAssets: ({ target }) => target !== 'node',
  },
});
