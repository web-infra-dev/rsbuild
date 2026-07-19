import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  dev: {
    watchFiles: [
      {
        paths: './test-temp-default.txt',
        type: 'restart',
      },
      {
        paths: './test-temp-custom.txt',
        type: 'restart',
        options: {
          cwd: '.',
        },
      },
    ],
  },
});
