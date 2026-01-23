import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  tools: {
    rspack: {
      module: {
        rules: [
          {
            with: { type: 'json' },
            loader: import.meta.resolve('./loaderWith.js'),
          },
        ],
      },
    },
  },
});
