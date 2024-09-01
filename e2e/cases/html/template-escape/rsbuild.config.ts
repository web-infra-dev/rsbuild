import path from 'node:path';
import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  source: {
    entry: {
      foo: path.resolve(__dirname, './src/foo.js'),
      bar: path.resolve(__dirname, './src/bar.js'),
    },
  },
  html: {
    template({ entryName }) {
      return `./static/${entryName}.html`;
    },
    templateParameters: {
      text: '<div>escape me</div>',
    },
  },
});
