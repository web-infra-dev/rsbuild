import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  output: {
    target: 'web-worker',
    module: true,
    distPath: { js: '' },
    filename: { js: '[name].mjs' },
  },
  tools: {
    rspack: {
      output: {
        library: { type: 'module' },
      },
    },
  },
});
