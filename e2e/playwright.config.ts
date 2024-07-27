import { defineConfig } from '@playwright/test';

export default defineConfig({
  retries: 1,
  use: {
    trace: 'on-first-retry',
  },
});
