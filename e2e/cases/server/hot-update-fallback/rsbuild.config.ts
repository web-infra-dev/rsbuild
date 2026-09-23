import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  dev: {
    hmr: false,
    liveReload: false,
  },
  server: {
    setup:
      ({ server }) =>
      () => {
        // Simulate SSR handling requests that pass through the HMR fallback.
        server.middlewares.use((_req, res) => {
          res.statusCode = 218;
          res.end('Downstream SSR');
        });
      },
  },
  output: {
    copy: [{ from: './src/*.hot-update.*', to: '[name][ext]' }],
  },
});
