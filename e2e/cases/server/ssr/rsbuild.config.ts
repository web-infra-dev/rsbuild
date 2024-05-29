import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  plugins: [pluginReact()],
  source: {
    entry({ target }) {
      if (target === 'web') {
        return {
          index: './src/index',
        };
      }
      if (target === 'node') {
        return {
          index: './src/index.server',
        };
      }
    },
  },
  html: {
    template: './template.html',
  },
  output: {
    targets: ['web', 'node'],
  },
});
