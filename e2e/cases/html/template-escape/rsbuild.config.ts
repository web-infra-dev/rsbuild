import path from 'node:path';
import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  source: {
    entry: {
      foo: path.resolve(import.meta.dirname, './src/foo.js'),
      bar: path.resolve(import.meta.dirname, './src/bar.js'),
    },
  },
  html: {
    template({ entryName }) {
      return `./static/${entryName}.html`;
    },
  },
});
