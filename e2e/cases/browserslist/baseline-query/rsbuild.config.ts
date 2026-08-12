import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  output: {
    minify: false,
    overrideBrowserslist: ['baseline widely available on 2022-01-01'],
  },
});
