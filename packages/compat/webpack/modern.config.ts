import { defineConfig, moduleTools } from '@modern-js/module-tools';
import {
  cjsBuildConfig,
  emitTypePkgJsonPlugin,
  esmBuildConfig,
} from '@rsbuild/config/modern.config.ts';

export default defineConfig({
  plugins: [moduleTools(), emitTypePkgJsonPlugin],
  buildConfig: [
    cjsBuildConfig,
    esmBuildConfig,
    // Types
    {
      buildType: 'bundleless',
      dts: {
        distPath: '../dist-types',
        only: true,
      },
    },
  ],
});
