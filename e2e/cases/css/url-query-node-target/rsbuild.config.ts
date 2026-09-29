import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  environments: {
    web: {
      output: {
        distPath: 'dist/web',
      },
    },
    node: {
      output: {
        target: 'node',
        distPath: 'dist/node',
      },
    },
  },
});
