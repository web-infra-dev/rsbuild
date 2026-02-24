import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  html: {
    template: './src/index.html',
  },
  tools: {
    bundlerChain(chain, { CHAIN_ID }) {
      chain.module
        .rule(CHAIN_ID.RULE.CSS)
        .oneOf(CHAIN_ID.ONE_OF.CSS_MAIN)
        .use('tailwindcss')
        .loader('@tailwindcss/webpack');
    },
  },
});
