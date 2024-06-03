import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  plugins: [pluginReact()],
  source: {
    entry({ target }) {
      if (target === 'web') {
        return {
          index: './src/index',
        };
      }
      if (target === 'node') {
        return {
          index: './src/index.server',
        };
      }
    },
  },
  html: {
    template: './template.html',
  },
  output: {
    targets: ['web', 'node'],
  },
  tools: {
    rspack: (config, { isServer }) => {
      if (process.env.TEST_ESM_LIBRARY && isServer) {
        return {
          ...config,
          experiments: {
            ...config.experiments,
            outputModule: true,
          },
          output: {
            ...config.output,
            filename: '[name].mjs',
            chunkFilename: '[name].mjs',
            chunkFormat: 'module',
            chunkLoading: 'import',
            library: {
              type: 'module',
            },
          },
        };
      }
      return config;
    },
  },
});
