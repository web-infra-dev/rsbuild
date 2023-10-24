import { defineConfig } from '@rsbuild/core';
import { pluginSourceBuild } from '@rsbuild/plugin-source-build';
import { webpackProvider } from '@rsbuild/webpack';

export default defineConfig({
  provider: webpackProvider,
  plugins: [pluginSourceBuild()],
  tools: {
    tsLoader: {},
  },
});
