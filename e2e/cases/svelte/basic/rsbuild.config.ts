import { pluginSvelte } from '@rsbuild/plugin-svelte';
import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  plugins: [pluginSvelte()],
  source: {
    entry: {
      index: './src/index.js',
    },
  },
});
