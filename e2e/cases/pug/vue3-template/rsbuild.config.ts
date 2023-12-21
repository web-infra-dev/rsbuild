import { pluginPug } from '@rsbuild/plugin-pug';
import { pluginVue } from '@rsbuild/plugin-vue';

export default {
  plugins: [pluginVue(), pluginPug()],
  html: {
    template: './src/index.pug',
  },
};
