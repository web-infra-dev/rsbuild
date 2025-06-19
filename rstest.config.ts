import { Console } from 'node:console';
import { defineConfig } from '@rstest/core';

// Disable color in test
process.env.NO_COLOR = '1';
process.env.FORCE_COLOR = '0';

// mock Console
global.console.Console = Console;

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
  testEnvironment: 'node',
  testTimeout: 30000,
  restoreMocks: true,
  include: ['packages/**/*.test.ts'],
  exclude: ['**/node_modules/**'],
  setupFiles: ['./scripts/test-helper/rstest.setup.ts'],
});
