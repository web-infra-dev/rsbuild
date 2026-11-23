import { defineConfig } from '@rsbuild/core';
import { pluginLess } from '@rsbuild/plugin-less';
import { pluginSass } from '@rsbuild/plugin-sass';

export default defineConfig({
  css: true,
  // TODO: Re-enable build cache when changes to CSS options invalidate cached modules.
  performance: { buildCache: false },
  output: {
    filenameHash: false,
  },
  plugins: [pluginLess(), pluginSass()],
});
