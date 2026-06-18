import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  source: {
    entry: {
      index: './src/index',
      'subdir/main': './src/index',
      'subdir/test': './src/index',
    },
  },
  html: {
    tags: [
      {
        tag: 'script',
        head: true,
        append: false,
        attrs: {
          src: './env-config.js',
        },
      },
    ],
  },
  output: {
    assetPrefix: 'auto',
  },
});
