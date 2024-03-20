import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  security: {
    nonce: 'this-is-nonce',
  },
  output: {
    inlineStyles: true,
    inlineScripts: true,
  },
});
