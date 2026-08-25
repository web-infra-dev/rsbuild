import { defineConfig } from '@rsbuild/core';
import { pluginSolid } from '@rsbuild/plugin-solid';

// Docs: https://rsbuild.rs/config/
export default defineConfig({
  plugins: [pluginSolid()],
});
