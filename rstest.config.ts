import { defineConfig } from '@rstest/core';
import { withRslibConfig } from '@rstest/adapter-rslib';

// Disable color in test
process.env.NO_COLOR = '1';

export default defineConfig({
  extends: withRslibConfig({
    cwd: __dirname,
    configPath: './packages/core/rslib.config.ts',
  }),
  source: {
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
