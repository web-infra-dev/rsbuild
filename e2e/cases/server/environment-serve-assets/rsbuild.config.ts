import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  server: { serveAssets: false },
  output: {
    filenameHash: false,
    sourceMap: { js: 'source-map' },
    distPath: { js: '' },
  },
  environments: {
    worker: {
      source: {
        entry: { worker: './src/index.js' },
      },
      dev: { assetPrefix: '/worker-assets/' },
      output: {
        target: 'web-worker',
        distPath: { root: 'dist/worker' },
        assetPrefix: '/worker-assets/',
      },
    },
    web: {
      server: { serveAssets: true },
      source: {
        entry: { index: './src/index.js', about: './src/index.js' },
      },
      dev: { assetPrefix: '/web-assets/' },
      output: {
        distPath: { root: 'dist/web' },
        assetPrefix: '/web-assets/',
      },
    },
    node: {
      server: { serveAssets: true },
      source: {
        entry: { server: './src/index.js' },
      },
      output: {
        target: 'node',
        distPath: { root: 'dist/node' },
      },
    },
  },
});
