import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  output: {
    cssModules: {
      exportGlobals: true,
    },
  },
});
