import { ModuleFederationPlugin } from '@module-federation/rspack';
import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  plugins: [pluginReact()],
  server: {
    port: Number(process.env.REMOTE_PORT) || 3002,
  },
  dev: {
    writeToDisk: true,
    assetPrefix: true,
  },
  tools: {
    rspack: {
      output: {
        uniqueName: 'remote',
      },
      plugins: [
        new ModuleFederationPlugin({
          name: 'remote',
          exposes: {
            './Button': './src/test-temp-Button',
          },
          shared: ['react', 'react-dom'],
        }),
      ],
    },
  },
});
