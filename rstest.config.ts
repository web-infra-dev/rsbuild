import { defineConfig } from '@rstest/core';
import { define } from './packages/core/rslib.config';

// Disable color in test
process.env.NO_COLOR = '1';

export default defineConfig({
  source: {
    define,
    tsconfigPath: './scripts/config/tsconfig.json',
  },
  output: {
    externals: ['@rsbuild/core'],
  },
  name: 'node',
  globals: true,
  restoreMocks: true,
  include: ['packages/**/*.test.ts'],
  exclude: ['packages/create-rsbuild/template-rstest'],
  setupFiles: ['./scripts/test-helper/rstest.setup.ts'],
});
