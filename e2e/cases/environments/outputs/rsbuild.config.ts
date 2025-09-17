import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  environments: {
    web: {
      output: {
        filenameHash: false,
      },
    },
    web1: {
      output: {
        filenameHash: false,
        distPath: {
          root: 'dist/web1',
        },
      },
    },
  },
});
