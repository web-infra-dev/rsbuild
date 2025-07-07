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
    // TODO: try to find closest tsconfig.json
    tsconfigPath: 'packages/core/tsconfig.json',
  },
  name: 'node',
  globals: true,
  restoreMocks: true,
  include: ['packages/**/*.test.ts'],
  setupFiles: ['./scripts/test-helper/rstest.setup.ts'],
});
