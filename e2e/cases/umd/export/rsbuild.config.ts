import { defineConfig } from '@rsbuild/core';
import { pluginUmd } from '@rsbuild/plugin-umd';

export default defineConfig({
  plugins: [
    pluginUmd({
      name: 'myLib',
      export: 'default',
    }),
  ],
  html: {
    template: './src/index.html',
  },
  tools: {
    htmlPlugin: {},
  },
});
