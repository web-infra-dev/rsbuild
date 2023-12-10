import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginWrangler } from './plugins/wrangler';

export default defineConfig({
  output: {
    targets: ['service-worker', 'web'],
  },
  dev: {
    writeToDisk: true,
    progressBar: false,
  },
  tools: {},
  plugins: [pluginReact(), pluginWrangler()],
});
