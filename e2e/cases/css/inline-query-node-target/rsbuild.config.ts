import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  dev: {
    writeToDisk: true,
  },
  environments: {
    web: {},
    node: {
      output: {
        target: 'node',
        module: true,
        distPath:
          process.env.NODE_ENV === 'production' ? 'dist-build' : 'dist-dev',
      },
    },
  },
});
