import { defineConfig } from '@rsbuild/core';
import { pluginSourceBuild } from '@rsbuild/plugin-source-build';
import { pluginTypeCheck } from '@rsbuild/plugin-type-check';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  plugins: [pluginSourceBuild(), pluginReact(), pluginTypeCheck()],
});
