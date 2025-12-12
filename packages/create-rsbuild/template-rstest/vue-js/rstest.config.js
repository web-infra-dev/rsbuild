import { pluginVue } from '@rsbuild/plugin-vue';
import { defineConfig } from '@rstest/core';

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
