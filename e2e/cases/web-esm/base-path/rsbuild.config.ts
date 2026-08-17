import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  server: {
    base: '/base',
  },
  output: {
    module: true,
  },
});
