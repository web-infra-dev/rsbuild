import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  plugins: [pluginReact()],
  source: {
    entry: {
      index: './src/index.js',
    },
  },
  tools: {
    rspack(config) {
      config.optimization ??= {};
      config.optimization.chunkIds = 'named';
      config.optimization.minimize = false;
      config.optimization.mangleExports = false;
      config.optimization.concatenateModules = false;

      config.output ??= {};
      config.output.asyncChunks = false;

      config.devtool = false;
    },
  },
  performance: {
    chunkSplit: {
      strategy: 'custom',
      override: {
        chunks: 'all',
        cacheGroups: {
          lib: {
            enforce: true,
            test: /(initial\.js|core-js)/,
            name: 'lib',
            chunks: 'all',
          },
          default: false,
          defaultVendors: false,
        },
      },
    },
  },
  dev: {
    lazyCompilation: true,
    writeToDisk: true,
  },
});
