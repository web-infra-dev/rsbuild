import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  // TODO: Re-enable build cache when this test can verify lazy compilation on cache hits.
  performance: { buildCache: false },
  dev: {
    lazyCompilation: {
      entries: false,
      imports: true,
    },
  },
});
