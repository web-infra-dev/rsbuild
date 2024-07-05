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
      config.output ??= {};
      config.output.asyncChunks = false;
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
  },
  output: {
    polyfill: 'usage',
  },
});
