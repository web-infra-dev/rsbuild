import { defineConfig } from '@rsbuild/core';
import { pluginSourceBuild } from '@rsbuild/plugin-source-build';

export default defineConfig({
  plugins: [pluginSourceBuild()],
});
