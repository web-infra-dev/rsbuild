import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  security: {
    sri: {
      enable: true,
    },
  },
  dev: {
    // TODO: skip lazyCompilation in sri
    lazyCompilation: true,
  },
});
