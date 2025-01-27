import { defineConfig } from '@rsbuild/core';
import { pluginRem } from '@rsbuild/plugin-rem';
import { pluginStylus } from '@rsbuild/plugin-stylus';

export default defineConfig({
  plugins: [pluginStylus(), pluginRem()],
});
