import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  {
    test: {
      name: 'node',
      globals: true,
      environment: 'node',
      testTimeout: 30000,
      restoreMocks: true,
      include: ['packages/**/*.test.ts'],
      setupFiles: ['./scripts/vitest.setup.ts'],
    },
  },
]);
