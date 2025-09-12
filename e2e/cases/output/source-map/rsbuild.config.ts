import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  plugins: [pluginReact()],
  performance: {
    chunkSplit: {
      strategy: 'all-in-one',
    },
  },
});
