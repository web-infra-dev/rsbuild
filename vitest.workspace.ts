import { defineWorkspace } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import { Console } from 'console';
import isCI from 'is-ci';

// Disable color in test
process.env.NO_COLOR = '1';
process.env.FORCE_COLOR = '0';

// mock Console
global.console.Console = Console;

export default defineWorkspace([
  {
    plugins: [tsconfigPaths()],
    test: {
      name: 'node',
      globals: true,
      environment: 'node',
      testTimeout: 30000,
      restoreMocks: true,
      include: ['packages/**/*.test.ts'],
      exclude: isCI
        ? [
            // TODO: failed in Ubuntu
            'packages/plugin-image-compress/**/*.test.ts',
            'packages/compat/plugin-swc/**/*.test.ts',
            '**/node_modules/**',
          ]
        : ['**/node_modules/**'],
      setupFiles: ['./scripts/vitest.setup.ts'],
    },
  },
]);
