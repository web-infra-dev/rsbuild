import { defineConfig } from '@modern-js/builder-cli';
import { pluginVue } from '@rsbuild/plugin-vue';

export default defineConfig({
  builderPlugins: [pluginVue()],
});
