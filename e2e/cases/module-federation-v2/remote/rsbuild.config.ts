import { pluginModuleFederation } from '@module-federation/rsbuild-plugin';
import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginModuleFederation({
      name: 'remote',
      exposes: {
        './Button': './src/test-temp-Button',
      },
      shared: ['react', 'react-dom'],
    }),
  ],
  server: {
    port: Number(process.env.REMOTE_PORT) || 3002,
  },
  dev: {
    writeToDisk: true,
  },
});
