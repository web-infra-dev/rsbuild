import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginMdx } from '@rsbuild/plugin-mdx';

export default defineConfig({
  plugins: [pluginReact(), pluginMdx()],
});
