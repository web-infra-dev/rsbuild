import { defineConfig } from '@rsbuild/core';
import { pluginLess } from '@rsbuild/plugin-less';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  output: {
    injectStyles: true,
  },
  plugins: [pluginReact(), pluginLess()],
});
