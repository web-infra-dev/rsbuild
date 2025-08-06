import { defineConfig } from '@rstest/core';
import { alias, define } from './packages/core/rslib.config';

// Disable color in test
process.env.NO_COLOR = '1';

export default defineConfig({
  source: {
    define,
    tsconfigPath: './scripts/config/tsconfig.json',
  },
  resolve: {
    alias,
  },
  output: {
    externals: ['@rsbuild/core'],
  },
  name: 'node',
  globals: true,
  restoreMocks: true,
  include: ['packages/**/*.test.ts'],
  setupFiles: ['./scripts/test-helper/rstest.setup.ts'],
});
