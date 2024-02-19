import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  output: {
    injectStyles: true,
  },
  plugins: [pluginReact()],
});
