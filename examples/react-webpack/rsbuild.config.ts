import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginCssMinimizer } from '@rsbuild/plugin-css-minimizer';
import { webpackProvider } from '@rsbuild/webpack';

export default defineConfig({
  plugins: [pluginReact(), pluginCssMinimizer()],
  provider: webpackProvider,
});
