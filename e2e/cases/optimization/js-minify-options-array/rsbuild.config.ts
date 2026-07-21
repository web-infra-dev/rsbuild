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
      css: false,
      jsOptions: [
        {
          include: /foo\.js$/,
          minimizerOptions: {
            compress: {
              drop_console: true,
            },
          },
        },
        {
          include: /bar\.js$/,
          minimizerOptions: {
            compress: {
              pure_funcs: ['console.info'],
            },
          },
        },
      ],
    },
  },
});
