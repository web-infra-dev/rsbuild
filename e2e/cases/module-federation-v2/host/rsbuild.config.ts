import { pluginModuleFederation } from '@module-federation/rsbuild-plugin';
import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginModuleFederation({
      name: 'host',
      remotes: {
        remote: `remote@http://localhost:${process.env.REMOTE_PORT || 3002}/mf-manifest.json`,
      },
      shared: ['react', 'react-dom'],
    }),
  ],
  dev: {
    writeToDisk: true,
  },
});
