import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  performance: {
    printFileSize: {
      diff: true,
    },
  },
});
