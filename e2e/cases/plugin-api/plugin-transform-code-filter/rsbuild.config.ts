import { defineConfig, type RsbuildPlugin } from '@rsbuild/core';

export default defineConfig({
  // TODO: Re-enable build cache when this test can observe the transform on cache hits.
  performance: { buildCache: false },
  plugins: [
    {
      name: 'generate-marker',
      setup(api) {
        api.transform({ test: /\.js$/, order: 'pre' }, ({ code }) =>
          code.replace('__SOURCE__', '__MARKER__'),
        );
      },
    } satisfies RsbuildPlugin,
  ],
});
