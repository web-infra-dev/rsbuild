import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginSvgr } from '@rsbuild/plugin-svgr';

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginSvgr({
      svgDefaultExport: 'url',
    }),
  ],
  output: {
    dataUriLimit: {
      svg: 1000,
    },
  },
});
