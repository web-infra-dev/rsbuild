import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  server: {
    // Let OPTIONS reach the HMR fallback instead of being handled by CORS.
    cors: false,
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
});
