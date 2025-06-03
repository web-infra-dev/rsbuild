import { Console } from 'node:console';
import { defineConfig } from 'vitest/config';

// Disable color in test
process.env.NO_COLOR = '1';
process.env.FORCE_COLOR = '0';

// mock Console
global.console.Console = Console;

export default defineConfig({
  define: {
    RSBUILD_VERSION: JSON.stringify(
      require('./packages/core/package.json').version,
    ),
  },
  test: {
    name: 'node',
    globals: true,
    environment: 'node',
    testTimeout: 30000,
    restoreMocks: true,
    include: ['packages/**/*.test.ts'],
    exclude: ['**/node_modules/**'],
    setupFiles: ['./scripts/test-helper/vitest.setup.ts'],
  },
});
