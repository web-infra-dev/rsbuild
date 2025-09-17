import path from 'node:path';
import { defineConfig } from '@rsbuild/core';
import { pluginLess } from '@rsbuild/plugin-less';
import { pluginSass } from '@rsbuild/plugin-sass';

export default defineConfig({
  plugins: [pluginLess(), pluginSass()],
  source: {
    entry: {
      entry1: path.resolve(__dirname, './src/entry1/index.js'),
      entry2: path.resolve(__dirname, './src/entry2/index.js'),
      entry3: path.resolve(__dirname, './src/entry3/index.js'),
    },
  },
});
