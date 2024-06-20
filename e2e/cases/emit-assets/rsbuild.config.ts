import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  output: {
    filenameHash: false,
    emitAssets: ({ target }) => target !== 'node',
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
