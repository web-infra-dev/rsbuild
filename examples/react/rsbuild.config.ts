import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  plugins: [pluginReact()],
  server: {
    proxy: {
      // http://localhost:3000/api -> http://localhost:3001/api
      // http://localhost:3000/api/foo -> http://localhost:3001/api/foo
      '/api': 'http://example.com:3001',
    },
  },
});
