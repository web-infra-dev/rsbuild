import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  source: {
    entry: {
      a: './src/index.js',
    },
  },
  output: {
    target: 'node',
    distPath: {
      js: '',
      jsAsync: '',
    },
    filename: {
      js: '[name].js',
    },
  },
});
