import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  tools: {
    rspack: {
      optimization: {
        splitChunks: {
          cacheGroups: {
            extra: {
              test: /extra\.js$/,
              name: 'extra',
              chunks: 'all',
              enforce: true,
            },
          },
        },
      },
    },
  },
});
