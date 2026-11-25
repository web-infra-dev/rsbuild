import { defineConfig } from '@rsbuild/core';
import { pluginTailwindcss } from '@rsbuild/plugin-tailwindcss';

export default defineConfig({
  html: {
    template: './src/index.html',
  },
  ...(process.env.RSBUILD_E2E_CSS === 'builtin'
    ? { css: { exportType: 'style' } }
    : { output: { injectStyles: true } }),
  plugins: [pluginTailwindcss()],
});
