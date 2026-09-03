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
