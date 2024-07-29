import { ModuleFederationPlugin } from '@module-federation/rspack';
import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  plugins: [pluginReact()],
  server: {
    port: 3000,
  },
  tools: {
    rspack: {
      output: {
        uniqueName: 'host',
      },
      plugins: [
        new ModuleFederationPlugin({
          name: 'host',
          remotes: {
            remote: 'remote@http://localhost:3002/mf-manifest.json',
          },
          shared: ['react', 'react-dom'],
        }),
      ],
    },
  },
});
