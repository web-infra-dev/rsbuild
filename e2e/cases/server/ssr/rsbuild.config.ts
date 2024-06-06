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

      if (process.env.TEST_SPLIT_CHUNK && isServer) {
        return {
          ...config,
          optimization: {
            runtimeChunk: true,
            splitChunks: {
              chunks: 'all',
              enforceSizeThreshold: 50000,
              minSize: 0,
              cacheGroups: {
                'lib-react': {
                  test: /[\\/]node_modules[\\/](react|react-dom|scheduler|react-refresh|@rspack[\\/]plugin-react-refresh)[\\/]/,
                  priority: 0,
                  name: 'lib-react',
                  reuseExistingChunk: true,
                },
              },
            },
          },
        };
      }
      return config;
    },
  },
});
