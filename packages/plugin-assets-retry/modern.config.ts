import { moduleTools } from '@modern-js/module-tools';
import { dualBuildConfigs } from '../../scripts/modern.base.config';

export default {
  plugins: [moduleTools()],
  buildConfig: dualBuildConfigs,
};
