import { defineConfig } from '@rsbuild/core';
import { pluginSwc } from '@rsbuild/plugin-swc';
import { webpackProvider } from '@rsbuild/webpack';

export default defineConfig({
  plugins: [pluginSwc()],
  provider: webpackProvider,
});
