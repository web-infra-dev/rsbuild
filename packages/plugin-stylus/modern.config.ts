import moduleTools from '@modern-js/module-tools';
import { buildConfigWithMjs } from '../../scripts/modern.base.config';

export default {
  plugins: [moduleTools()],
  buildConfig: buildConfigWithMjs.map((config) => {
    return {
      ...config,
      externals: ['@rsbuild/webpack/plugin-css'],
    };
  }),
};
