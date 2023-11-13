import { baseBuildConfig } from '../../scripts/modern.base.config';

export default {
  ...baseBuildConfig,
  buildConfig: [
    {
      ...baseBuildConfig.buildConfig,
      input: ['src', '!src/client'],
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
      // bundle shared deps when used in client
      autoExternal: false,
    },
  ],
};
