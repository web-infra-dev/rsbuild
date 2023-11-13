import { baseBuildConfig } from '../../scripts/modern.base.config';

export default {
  ...baseBuildConfig,
  buildConfig: [
    baseBuildConfig.buildConfig,
    {
      buildType: 'bundleless',
      format: 'esm',
      target: 'es5',
      dts: false,
      sourceDir: 'client',
      outDir: './dist/client',
      // bundle shared deps when used in client
      autoExternal: false,
    },
  ],
};
