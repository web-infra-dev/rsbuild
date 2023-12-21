import { pluginPug } from '@rsbuild/plugin-pug';
import { pluginVue2 } from '@rsbuild/plugin-vue2';

export default {
  plugins: [pluginVue2(), pluginPug()],
  html: {
    template: './src/index.pug',
  },
};
