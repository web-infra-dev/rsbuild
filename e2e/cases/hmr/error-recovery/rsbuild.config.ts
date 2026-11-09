import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  // TODO: Re-enable build cache when Rspack no longer panics on HMR after a compile error.
  performance: { buildCache: false },
  plugins: [pluginReact()],
});
