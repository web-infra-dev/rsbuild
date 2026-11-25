import { defineConfig } from '@rsbuild/core';
import { pluginLess } from '@rsbuild/plugin-less';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginSass } from '@rsbuild/plugin-sass';

export default defineConfig({
  plugins: [pluginLess(), pluginSass(), pluginReact()],
  ...(process.env.RSBUILD_E2E_CSS === 'builtin'
    ? { css: { exportType: 'style' } }
    : { output: { injectStyles: true } }),
});
