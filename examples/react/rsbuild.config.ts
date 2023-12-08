import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  plugins: [pluginReact()],
  output: {
    targets: ['web', 'node', 'service-worker', 'web-worker'],
  },
});
