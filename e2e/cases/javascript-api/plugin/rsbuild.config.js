import { defineConfig } from '@rsbuild/core';
import { pluginVue } from '@rsbuild/plugin-vue';

module.exports = defineConfig({
  plugins: [pluginVue()],
});
