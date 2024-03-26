import { defineConfig } from '@modern-js/module-tools';
import { baseBuildConfig } from '../../scripts/modern.base.config';

export default defineConfig({
  ...baseBuildConfig,
  buildConfig: [
    {
      ...baseBuildConfig.buildConfig,
      input: ['src', '!src/client/hmr'],
    },
    {
      buildType: 'bundle',
      format: 'esm',
      target: 'es5',
      dts: false,
      input: {
        hmr: 'src/client/hmr/index.ts',
      },
      outDir: './dist/client',
      autoExtension: true,
      // bundle shared deps when used in client
      autoExternal: false,
    },
  ],
});
