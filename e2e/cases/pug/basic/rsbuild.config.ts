import { pluginPug } from '@rsbuild/plugin-pug';

export default {
  plugins: [pluginPug()],
  html: {
    template: './src/index.pug',
  },
};
