import { defineConfig } from '@rsbuild/core';
import content from './test-temp-config';

export default defineConfig({
  dev: {
    watchFiles: [
      {
        type: 'reload-page',
        paths: ['./some-file.ts'],
      },
      {
        type: 'reload-server',
        paths: ['./test-temp-config.ts'],
      },
    ],
  },
  source: {
    define: {
      CONTENT: JSON.stringify(content),
    },
  },
  server: {
    port: Number(process.env.PORT),
  },
});
