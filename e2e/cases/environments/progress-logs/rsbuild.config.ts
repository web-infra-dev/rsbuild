import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  dev: {
    progressBar: true,
  },
  environments: {
    fast: {},
    slow: {},
  },
});
