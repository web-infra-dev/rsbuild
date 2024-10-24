import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  output: {
    distPath: {
      root: `dist/${process.env.NODE_ENV}`,
    },
  },
});
