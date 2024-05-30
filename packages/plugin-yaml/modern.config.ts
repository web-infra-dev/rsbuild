import { moduleTools } from '@modern-js/module-tools';
import { dualBuildConfigs } from '@rsbuild/config/modern';

export default {
  plugins: [moduleTools()],
  buildConfig: dualBuildConfigs,
};
