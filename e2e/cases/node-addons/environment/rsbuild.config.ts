import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  environments: {
    esm: {
      output: {
        target: 'node',
        distPath: 'dist/esm',
      },
    },
    cjs: {
      output: {
        target: 'node',
        distPath: 'dist/cjs',
        filename: {
          js: '[name].cjs',
        },
        module: false,
      },
    },
  },
});
