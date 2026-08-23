// @ts-check
import { defineConfig } from '@rsbuild/core';
import { pluginOctane } from '@octanejs/rsbuild-plugin';

// Docs: https://rsbuild.rs/config/
export default defineConfig({
  plugins: [pluginOctane()],
});
