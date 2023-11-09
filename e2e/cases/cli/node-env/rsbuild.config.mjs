import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  output: {
    distPath: {
      root: process.env.NODE_ENV === 'production' ? 'dist-prod' : 'dist-dev',
    },
  },
});
