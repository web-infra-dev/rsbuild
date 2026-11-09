import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  // TODO: Re-enable build cache when changing modes invalidates the cached NODE_ENV replacement.
  performance: { buildCache: false },
});
