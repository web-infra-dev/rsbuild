import { join } from 'node:path';
import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  plugins: [pluginReact()],
  dev: {
    client: {
      webSocketTransport: join(__dirname, 'customTransport.js'),
    },
  },
});
