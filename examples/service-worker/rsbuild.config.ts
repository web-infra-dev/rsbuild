import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  source: {
    entry: { sw: './src/sw.ts' },
  },
  output: {
    distPath: {
      root: './dist',
      worker: './',
    },
    target: 'service-worker',
    copy: ['./index.html'],
  },
});
