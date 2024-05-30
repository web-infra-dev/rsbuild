import { moduleTools } from '@modern-js/module-tools';
import { dualBuildConfigs } from '@rsbuild/config/modern';

export default {
  plugins: [moduleTools()],
  buildConfig: dualBuildConfigs.map((config) => {
    if (config.format === 'cjs') {
      // add loader to entry
      config.input = ['src/index.ts', 'src/loader.ts'];
    }
    return config;
  }),
};
