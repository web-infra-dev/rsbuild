import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { mfConfig } from './module-federation.config';

export default defineConfig({
  plugins: [pluginReact()],
  dev: {
    assetPrefix: 'auto',
  },
  server: {
    port: Number(process.env.REMOTE_PORT) || 3002,
  },
  performance: {
    chunkSplit: {
      override: {
        chunks: 'async',
      },
    },
  },
  tools: {
    rspack(_config, { rspack, appendPlugins }) {
      appendPlugins(new rspack.container.ModuleFederationPlugin(mfConfig));
    },
  },
});
