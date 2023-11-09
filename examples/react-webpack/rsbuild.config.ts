import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { webpackProvider } from '@rsbuild/webpack';

export default defineConfig({
  plugins: [pluginReact()],
  provider: webpackProvider,
});
