import { moduleTools } from '@modern-js/module-tools';
import {
  cjsBuildConfig,
  emitTypePkgJsonPlugin,
  esmBuildConfig,
} from '@rsbuild/config/modern.config.ts';

export default {
  plugins: [moduleTools(), emitTypePkgJsonPlugin],
  buildConfig: [
    {
      ...esmBuildConfig,
      externals: [
        ...(esmBuildConfig.externals || []),
        'svelte/compiler',
        'svelte-preprocess/dist/types',
      ],
    },
    {
      ...cjsBuildConfig,
      externals: [
        ...(cjsBuildConfig.externals || []),
        'svelte/compiler',
        'svelte-preprocess/dist/types',
      ],
    },
    {
      buildType: 'bundleless',
      dts: {
        distPath: '../dist-types',
        only: true,
      },
    },
  ],
};
