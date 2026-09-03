import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  server: {
    htmlFallback: false,
  },
  environments: {
    node: {
      dev: {
        assetPrefix: '/server-assets/',
      },
      output: {
        target: 'node',
      },
      source: {
        entry: {
          server: './src/server.js',
        },
      },
    },
  },
});
