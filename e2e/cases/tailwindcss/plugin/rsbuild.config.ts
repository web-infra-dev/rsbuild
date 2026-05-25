import { defineConfig } from '@rsbuild/core';
import { pluginTailwindCSS } from '@rsbuild/plugin-tailwindcss';

export default defineConfig({
  html: {
    template: './src/index.html',
  },
  plugins: [pluginTailwindCSS()],
});
