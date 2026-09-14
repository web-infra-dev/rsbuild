import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  source: {
    entry: {
      index: './src/index.css',
    },
  },
  output: {
    filenameHash: false,
  },
});
