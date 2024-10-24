import { defineConfig } from '@rsbuild/core';
import { pluginSwc } from '@rsbuild/plugin-webpack-swc';
import { webpackProvider } from '@rsbuild/webpack';

export default defineConfig({
  plugins: [pluginSwc()],
  provider: webpackProvider,
});
