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
        distPath: 'dist/server',
        filenameHash: false,
      },
      source: {
        entry: {
          server: './src/server.js',
          shared: './src/server.js',
        },
      },
    },
    web: {
      dev: {
        assetPrefix: '/browser-assets/',
      },
      output: {
        distPath: 'dist/client',
        filenameHash: false,
      },
      source: {
        entry: {
          shared: './src/client.js',
        },
      },
    },
  },
});
