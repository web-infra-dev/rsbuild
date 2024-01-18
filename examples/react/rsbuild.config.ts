import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  plugins: [pluginReact()],
  source: {
    entry: {
      index: './src/index.jsx',
      detail: './src/App.jsx',
    },
  },
  server: {
    printUrls({ routes }) {
      console.log(routes);
    },
  },
});
