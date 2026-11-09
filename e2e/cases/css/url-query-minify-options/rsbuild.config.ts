import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  // TODO: Re-enable build cache when changes to CSS minimizer options invalidate cached CSS URLs.
  performance: { buildCache: false },
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
