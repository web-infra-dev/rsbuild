import path from 'node:path';
import { pluginLess } from '@rsbuild/plugin-less';

export default {
  plugins: [pluginLess()],
  source: {
    alias: {
      '@common': path.resolve(__dirname, 'src/common'),
    },
  },
};
