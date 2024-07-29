import { ModuleFederationPlugin } from '@module-federation/enhanced/rspack';
import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  plugins: [pluginReact()],
  server: {
    port: 3002,
  },
  dev: {
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
            './Button': './src/Button',
          },
          shared: ['react', 'react-dom'],
        }),
      ],
    },
  },
});
