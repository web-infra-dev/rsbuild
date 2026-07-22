import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  source: {
    entry: {
      foo: './src/foo.js',
      bar: './src/bar.js',
    },
  },
  output: {
    filenameHash: false,
    minify: {
      js: false,
      cssOptions: [
        {
          include: /foo\.css$/,
          minimizerOptions: {
            unusedSymbols: ['foo-unused'],
          },
        },
        {
          include: /bar\.css$/,
          minimizerOptions: {
            unusedSymbols: ['bar-unused'],
          },
        },
      ],
    },
  },
});
