import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  tools: {
    lightningcssLoader: {
      targets: { safari: '10.0.0' },
      unusedSymbols: ['loader-unused'],
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
