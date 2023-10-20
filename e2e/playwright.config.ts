import { defineConfig } from '@playwright/test';

export default defineConfig({
  // exclude webpack / rspack self-feature test cases when run rspack / webpack test
  testIgnore: [
    ...(process.env.PROVIDE_TYPE === 'webpack'
      ? ['**/cases/**/**.rspack.test.ts']
      : ['**/cases/**/**.webpack.test.ts', '**/cases/**/**.swc.test.ts']),
  ],
});
