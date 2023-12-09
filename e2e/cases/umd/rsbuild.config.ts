import { defineConfig } from '@rsbuild/core';
import { pluginUmd } from '@rsbuild/plugin-umd';

export default defineConfig({
  plugins: [
    pluginUmd({
      name: 'myLib',
    }),
  ],
  html: {
    template: './src/index.html',
    scriptLoading: 'blocking',
  },
  tools: {
    htmlPlugin: {},
  },
});
