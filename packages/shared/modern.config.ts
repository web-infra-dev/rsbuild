import { defineConfig, moduleTools } from '@modern-js/module-tools';
import {
  cjsBuildConfig,
  commonExternals,
  emitTypePkgJsonPlugin,
  esmBuildConfig,
} from '../../scripts/modern.base.config';

export default defineConfig({
  plugins: [moduleTools(), emitTypePkgJsonPlugin],
  buildConfig: [
    {
      ...esmBuildConfig,
      dts: false,
    },
    cjsBuildConfig,
    {
      externals: commonExternals,
      buildType: 'bundleless',
      dts: {
        distPath: '../dist-types',
        only: true,
      },
    },
  ],
});
