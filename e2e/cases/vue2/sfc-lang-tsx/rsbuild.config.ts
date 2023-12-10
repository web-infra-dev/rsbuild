import { defineConfig } from '@rsbuild/core';
import { pluginVue2 } from '@rsbuild/plugin-vue2';
import { pluginVue2Jsx } from '@rsbuild/plugin-vue2-jsx';
import { pluginBabel } from '@rsbuild/plugin-babel';

export default defineConfig({
  plugins: [pluginVue2(), pluginVue2Jsx(), pluginBabel()],
});
