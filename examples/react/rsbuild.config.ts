import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  environments: {
    web: {
      output: {
        overrideBrowserslist: ['iOS >= 9', 'Android >= 4.4'],
      },
    },
    node: {
      output: {
        overrideBrowserslist: ['node >= 20'],
      },
    },
  },
});
