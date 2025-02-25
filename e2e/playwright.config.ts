import { defineConfig } from '@playwright/test';

console.log('very begin', Date.now());

export default defineConfig({
  // Retry on CI
  retries: process.env.CI ? 3 : 0,
  // Print line for each test being run in CI
  reporter: [['list'], ['json', { outputFile: 'report.json' }]],
  workers: 1,
});
