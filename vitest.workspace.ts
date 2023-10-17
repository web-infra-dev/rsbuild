import { defineWorkspace } from 'vitest/config';

// Disable chalk in test
process.env.FORCE_COLOR = '0';

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
