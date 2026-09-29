import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  tools: {
    lightningcssLoader: {
      unusedSymbols: ['loader-unused'],
      pseudoClasses: {
        hover: 'loader-hover',
        focus: 'loader-focus',
      },
    },
  },
  environments: {
    web: {
      output: { distPath: 'dist/web' },
    },
    node: {
      output: { target: 'node', distPath: 'dist/node' },
    },
  },
});
