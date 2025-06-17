import { pluginLess } from '@rsbuild/plugin-less';

export default {
  plugins: [
    pluginLess({
      exclude: /b\.less$/,
    }),
  ],
};
