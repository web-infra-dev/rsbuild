import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  tools: {
    rspack: {
      module: {
        rules: [
          {
            with: { type: 'json' },
            loader: require.resolve('./loaderWith.js'),
          },
        ],
      },
    },
  },
});
