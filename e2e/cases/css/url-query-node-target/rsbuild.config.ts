import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  // TODO: Re-enable build cache when changes to CSS minification invalidate cached CSS URLs.
  performance: { buildCache: false },
  environments: {
    web: {
      output: {
        distPath: 'dist/web',
      },
    },
    node: {
      output: {
        target: 'node',
        distPath: 'dist/node',
      },
    },
  },
});
