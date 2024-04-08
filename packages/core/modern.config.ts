import { defineConfig } from '@modern-js/module-tools';
import { baseBuildConfig } from '../../scripts/modern.base.config';

export default defineConfig({
  ...baseBuildConfig,
  buildConfig: [
    {
      ...baseBuildConfig.buildConfig,
      input: ['src', '!src/client/hmr',  '!src/client/overlay'],
    },
    {
      buildType: 'bundle',
      format: 'esm',
      target: 'es5',
      dts: false,
      input: {
        hmr: 'src/client/hmr/index.ts',
        overlay: 'src/client/overlay/index.ts',
      },
      outDir: './dist/client',
      autoExtension: true,
    },
  ],
});
