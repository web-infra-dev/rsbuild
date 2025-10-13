/// <reference types="@rsbuild/core/types" />
import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  output: {
    distPath: `dist/${import.meta.env.FOO}`,
  },
});
