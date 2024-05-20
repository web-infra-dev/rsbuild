import { moduleTools } from '@modern-js/module-tools';
import { dualBuildConfigs } from '../../scripts/modern.base.config';

export default {
  plugins: [moduleTools()],
  buildConfig: dualBuildConfigs.map((config) => {
    config.externals = [
      ...(config.externals || []),
      'svelte/compiler',
      'svelte-preprocess/dist/types',
    ];
    return config;
  }),
};
