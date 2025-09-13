/// <reference types="@rsbuild/core/types" />
import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  output: {
    distPath: {
      root: `dist/${import.meta.env.FOO}`,
    },
  },
});
