import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  // TODO: Re-enable build cache when changes to exportLocalsConvention invalidate cached CSS Modules.
  performance: { buildCache: false },
});
