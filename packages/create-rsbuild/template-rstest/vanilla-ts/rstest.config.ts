import { defineConfig } from '@rstest/core';

// Docs: https://rstest.rs/config/
export default defineConfig({
  testEnvironment: 'jsdom',
  setupFiles: ['./rstest.setup.ts'],
});
