import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  performance: {
    chunkSplit: {
      strategy: 'all-in-one',
    },
  },
  environments: {
    foo: {
      source: {
        entry: {
          foo: './src/foo.js',
        },
      },
    },
    bar: {
      source: {
        entry: {
          bar: './src/bar.js',
        },
      },
      dev: {
        hmr: false,
        liveReload: false,
      },
    },
  },
});
