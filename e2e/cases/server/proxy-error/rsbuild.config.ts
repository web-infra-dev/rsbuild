import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  server: {
    cors: true,
    proxy: [
      {
        pathFilter: '/api',
        target: 'http://127.0.0.1:1',
        changeOrigin: true,
        secure: false,
      },
    ],
  },
});
