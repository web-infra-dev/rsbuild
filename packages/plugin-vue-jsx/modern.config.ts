import moduleTools from '@modern-js/module-tools';
import { buildConfigWithMjs } from '../../scripts/modern.base.config';

export default {
  plugins: [moduleTools()],
  buildConfig: buildConfigWithMjs.map((config) => {
    if (config.format === 'cjs') {
      // add loader to entry
      config.input = ['src/index.ts', 'src/loader.ts'];
    }
    return config;
  }),
};
