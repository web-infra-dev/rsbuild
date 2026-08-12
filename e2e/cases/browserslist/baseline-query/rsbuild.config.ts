import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  output: {
    overrideBrowserslist: ['baseline widely available on 2022-01-01'],
  },
});
