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
    rspack: {
      lazyCompilation: true,
      output: {
        asyncChunks: false,
      },
    },
  },
  splitChunks: {
    cacheGroups: {
      lib: {
        enforce: true,
        test: /initial\.js/,
        name: 'lib',
        chunks: 'all',
      },
      default: false,
      defaultVendors: false,
    },
  },
});
