import { defineConfig } from '@rstest/core';

// Docs: https://rstest.rs/config/
export default defineConfig({
  testEnvironment: 'happy-dom',
  setupFiles: ['./rstest.setup.js'],
});
