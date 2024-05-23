import path from 'node:path';
import { pluginLess } from '@rsbuild/plugin-less';
import { pluginSass } from '@rsbuild/plugin-sass';

export default {
  plugins: [pluginLess(), pluginSass()],
  source: {
    alias: {
      '@common': path.resolve(__dirname, 'src/common'),
    },
  },
};
