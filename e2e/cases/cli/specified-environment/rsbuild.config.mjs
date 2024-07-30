import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  environments: {
    web1: {
      output: {
        distPath: {
          root: 'dist/web1',
        },
      },
    },
    web2: {
      output: {
        distPath: {
          root: 'dist/web2',
        },
      },
    },
  },
});
