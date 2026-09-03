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
        assetPrefix: '/server-assets/',
        target: 'node',
        distPath: 'dist/server',
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
        assetPrefix: '/browser-assets/',
        distPath: 'dist/client',
      },
      source: {
        entry: {
          shared: './src/client.js',
        },
      },
    },
  },
});
