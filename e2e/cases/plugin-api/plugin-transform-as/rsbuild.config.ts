import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  performance: { buildCache: false },
  output: { minify: false },
  tools: {
    swc: {
      jsc: { target: 'es2017' },
    },
  },
});
