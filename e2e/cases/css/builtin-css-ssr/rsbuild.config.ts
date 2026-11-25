import { defineConfig } from '@rsbuild/core';
import { pluginLess } from '@rsbuild/plugin-less';
import { pluginSass } from '@rsbuild/plugin-sass';
import { pluginTailwindcss } from '@rsbuild/plugin-tailwindcss';

export default defineConfig({
  css: true,
  performance: { buildCache: false },
  output: {
    dataUriLimit: 0,
  },
  plugins: [
    pluginLess({
      lessLoaderOptions: {
        additionalData: '.injected-less { color: red; }\n',
      },
    }),
    pluginSass({
      sassLoaderOptions: {
        additionalData: '.injected-sass { color: blue; }\n',
      },
    }),
    pluginTailwindcss({ optimize: false }),
  ],
  environments: {
    web: {
      source: {
        entry: { index: './src/client.ts' },
      },
      output: {
        distPath: 'dist/web',
      },
    },
    node: {
      source: {
        entry: { index: './src/server.ts' },
      },
      output: {
        target: 'node',
        distPath: 'dist/node',
      },
    },
  },
});
