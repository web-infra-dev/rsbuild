import { defineConfig } from '@rsbuild/core';
import { pluginStylus } from '@rsbuild/plugin-stylus';

export default defineConfig({
  plugins: [pluginStylus()],
});
