import { ModuleFederationPlugin } from '@module-federation/enhanced/rspack';
import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  plugins: [pluginReact()],
  tools: {
    rspack: {
      output: {
        uniqueName: 'host',
      },
      plugins: [
        new ModuleFederationPlugin({
          name: 'host',
          remotes: {
            remote: `remote@http://localhost:${process.env.REMOTE_PORT || 3002}/mf-manifest.json`,
          },
          shared: ['react', 'react-dom'],
        }),
      ],
    },
  },
});
