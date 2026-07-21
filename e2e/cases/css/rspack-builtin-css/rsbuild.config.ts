import { defineConfig, pluginRspackBuiltinCss } from '@rsbuild/core';
import { pluginLess } from '@rsbuild/plugin-less';
import { pluginSass } from '@rsbuild/plugin-sass';

export default defineConfig({
  output: {
    filenameHash: false,
  },
  plugins: [pluginLess(), pluginSass(), pluginRspackBuiltinCss()],
});
