import { defineConfig } from '@playwright/test';

export default defineConfig({
  testMatch: ['**/cases/doctor-*/**/**.test.ts'],
});
