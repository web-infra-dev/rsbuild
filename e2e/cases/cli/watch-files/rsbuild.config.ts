import { defineConfig } from '@rsbuild/core';
// rslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore temp file
import content from './test-temp-config';

export default defineConfig({
  dev: {
    watchFiles: {
      type: 'restart',
      paths: ['./test-temp-config.ts'],
    },
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
