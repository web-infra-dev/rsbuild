import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  // TODO: Re-enable build cache when changes to output.charset invalidate cached bundles.
  performance: { buildCache: false },
});
