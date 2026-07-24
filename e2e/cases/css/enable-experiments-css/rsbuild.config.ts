import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  experiments: {
    css: true,
  },
  output: {
    filenameHash: false,
  },
});
