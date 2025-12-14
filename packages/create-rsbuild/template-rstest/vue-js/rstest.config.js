import { pluginVue } from '@rsbuild/plugin-vue';
import { defineConfig } from '@rstest/core';

// Docs: https://rstest.rs/config/
export default defineConfig({
  plugins: [
    pluginVue({
      vueLoaderOptions: {
        isServerBuild: false,
      },
    }),
  ],
  testEnvironment: 'jsdom',
  setupFiles: ['./rstest.setup.js'],
});
