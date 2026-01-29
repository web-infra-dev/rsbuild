import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  splitChunks: {
    preset: 'single-vendor',
  },
  performance: {
    printFileSize: {
      diff: true,
    },
  },
});
