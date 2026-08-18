import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  output: {
    module: true,
  },
  html: {
    scriptLoading: 'blocking',
  },
});
