import { defineConfig } from '@rsbuild/core';
import { pluginSolid } from '@rsbuild/plugin-solid';

export default defineConfig({
  source: {
    decorators: {
      version: 'legacy',
    },
  },
  plugins: [pluginSolid({ compiler: 'babel' })],
});
