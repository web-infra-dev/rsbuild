import { defineConfig } from '@rsbuild/core';
import { webpackProvider } from '@rsbuild/webpack';
import { pluginSourceBuild } from '@rsbuild/plugin-source-build';

export default defineConfig({
  provider: webpackProvider,
  plugins: [pluginSourceBuild()],
});
