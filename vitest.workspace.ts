import { defineWorkspace } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import { Console } from 'console';

// Disable color in test
process.env.NO_COLOR = '1';
process.env.FORCE_COLOR = '0';

// mock Console
global.console.Console = Console;

export default defineWorkspace([
  {
    plugins: [tsconfigPaths()],
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
      setupFiles: ['./scripts/vitest.setup.ts'],
    },
  },
]);
