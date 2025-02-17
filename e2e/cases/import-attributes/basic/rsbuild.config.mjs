import { createRequire } from 'node:module';
import { defineConfig } from '@rsbuild/core';

const require = createRequire(import.meta.url);

export default defineConfig({
  tools: {
    rspack: {
      module: {
        rules: [
          {
            with: { type: 'json' },
            loader: require.resolve('./loaderWith.cjs'),
          },
        ],
      },
    },
  },
});
