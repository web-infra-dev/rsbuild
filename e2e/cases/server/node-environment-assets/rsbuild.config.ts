import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  dev: {
    hmr: false,
    liveReload: false,
  },
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
        filenameHash: false,
      },
      source: {
        entry: {
          server: './src/server.js',
        },
      },
    },
  },
});
