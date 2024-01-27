import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import mfConfig from './module-federation.config';

export default defineConfig({
  plugins: [pluginReact()],
  dev: {
    assetPrefix: 'auto',
  },
  server: {
    port: 3002,
  },
  performance: {
    chunkSplit: {
      strategy: 'split-by-experience',
      override: {
        chunks: 'async',
        minSize: 30000,
      },
    },
  },
  tools: {
    rspack(config, { rspack, appendPlugins }) {
      appendPlugins(new rspack.container.ModuleFederationPlugin(mfConfig));
    },
  },
});
