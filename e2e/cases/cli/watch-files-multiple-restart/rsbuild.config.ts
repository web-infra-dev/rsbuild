import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  // TODO: Re-enable build cache when this test waits for the restart watchers to be ready.
  performance: { buildCache: false },
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
