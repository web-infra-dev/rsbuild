import { defineConfig } from '@rsbuild/core';

export default defineConfig({
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
        emitAssets: false,
      },
    },
  },
});
