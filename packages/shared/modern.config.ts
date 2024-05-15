import { moduleTools } from '@modern-js/module-tools';
import { buildConfigWithMjs } from '../../scripts/modern.base.config';

export default {
  plugins: [moduleTools()],
  buildConfig: buildConfigWithMjs.map((config) => {
    config.externals = [...(config.externals || []), 'mini-css-extract-plugin'];
    return config;
  }),
};
