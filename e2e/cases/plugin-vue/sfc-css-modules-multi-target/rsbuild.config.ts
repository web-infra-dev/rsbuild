import { defineConfig } from '@rsbuild/core';
import { pluginVue } from '@rsbuild/plugin-vue';

export default defineConfig({
  plugins: [pluginVue()],
  environments: {
    web: {
      source: {
        entry: {
          index: './src/index.js',
        },
      },
      output: {
        target: 'web',
        distPath: {
          root: './dist/web',
        },
      },
    },
    node: {
      source: {
        entry: {
          index: './src/index.js',
        },
      },
      output: {
        target: 'node',
        distPath: {
          root: './dist/node',
        },
      },
    },
  },
});
