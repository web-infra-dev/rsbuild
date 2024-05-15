import { moduleTools } from '@modern-js/module-tools';
import { dualBuildConfigs } from '../../../scripts/modern.base.config';

export default {
  plugins: [moduleTools()],
  buildConfig: dualBuildConfigs.map((config) => {
    config.input = [
      'src/index.ts',
      'src/web.ts',
      'src/node.ts',
      'src/pluginLockCorejsVersion.ts',
    ];
    return config;
  }),
};
