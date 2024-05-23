import { defineConfig } from '@rsbuild/core';
import { pluginVue2 } from '@rsbuild/plugin-vue2';

export default defineConfig({
  plugins: [pluginVue2()],
});
