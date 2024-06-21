import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  source: {
    entry: { sw: './src/sw.ts' },
  },
  output: {
    distPath: {
      root: './dist',
    },
    target: 'web-worker',
    copy: ['./index.html'],
  },
});
