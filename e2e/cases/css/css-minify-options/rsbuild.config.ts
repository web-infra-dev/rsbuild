import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  output: {
    minify: {
      cssOptions: {
        unusedSymbols: ['foo', 'fade-in', '--color'],
      },
    },
  },
});
