import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginRem } from '@rsbuild/plugin-rem';

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginRem({
      inlineRuntime: false,
    }),
  ],
  html: {
    crossorigin: 'use-credentials',
  },
});
