import { defineConfig } from '@rstest/core';

// Disable color in test
process.env.NO_COLOR = '1';

export default defineConfig({
  source: {
    define: {
      RSBUILD_VERSION: JSON.stringify(
        require('./packages/core/package.json').version,
      ),
    },
    tsconfigPath: './scripts/config/tsconfig.json',
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
