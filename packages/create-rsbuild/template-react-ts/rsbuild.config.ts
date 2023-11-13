import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  plugins: [pluginReact()],
  source: {
    entries: {
      main: './src/index.tsx',
    },
  },
  output: {
    distPath: {
      html: 'html',
    },
  },
});
