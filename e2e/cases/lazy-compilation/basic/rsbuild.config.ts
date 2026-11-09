import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  // TODO: Re-enable build cache when these tests can verify lazy compilation on cache hits.
  performance: { buildCache: false },
  plugins: [pluginReact()],
  source: {
    entry: {
      page1: './src/page1/index.js',
      page2: './src/page2/index.js',
    },
  },
});
