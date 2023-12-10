import path from 'path';
import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginWrangler } from './plugins/wrangler';

export default defineConfig({
  output: {
    targets: ['service-worker', 'web'],
    distPath: {
      worker: path.resolve('build/renderer'),
    },
  },
  dev: {
    writeToDisk: true,
    progressBar: false,
  },
  tools: {},
  plugins: [pluginReact(), pluginWrangler()],
});
