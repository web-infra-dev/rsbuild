import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { mfConfig } from './moduleFederation.config';

export default defineConfig({
  plugins: [pluginReact()],
  moduleFederation: {
    options: mfConfig,
  },
  server: {
    cors: {
      origin: 'https://localhost',
    },
  },
});
