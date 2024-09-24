import { defineConfig, moduleTools } from '@modern-js/module-tools';
import {
  cjsBuildConfig,
  commonExternals,
  emitTypePkgJsonPlugin,
  esmBuildConfig,
} from '@rsbuild/config/modern.config.ts';

export default defineConfig({
  plugins: [moduleTools(), emitTypePkgJsonPlugin],
  buildConfig: [
    {
      ...esmBuildConfig,
      dts: false,
    },
    {
      ...cjsBuildConfig,
      // add loader to entry
      input: ['src/index.ts', 'src/loader.ts'],
    },
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
