import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  output: {
    module: true,
  },
  tools: {
    rspack: {
      module: {
        parser: {
          javascript: {
            worker: ['default from ./blob-worker.js', '...'],
          },
        },
      },
    },
  },
});
