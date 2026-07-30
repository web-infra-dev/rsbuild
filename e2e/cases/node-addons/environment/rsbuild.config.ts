import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  output: {
    target: 'node',
  },
  environments: {
    esm: {
      output: {
        distPath: 'dist/esm',
      },
    },
    cjs: {
      output: {
        distPath: 'dist/cjs',
        filename: {
          js: '[name].cjs',
        },
        module: false,
      },
    },
  },
});
