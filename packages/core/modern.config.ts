import { defineConfig } from '@modern-js/module-tools';
import { baseBuildConfig } from '../../scripts/modern.base.config';

export default defineConfig({
  ...baseBuildConfig,
  buildConfig: [
    {
      ...baseBuildConfig.buildConfig,
      input: ['src', '!src/client/hmr', '!src/client/overlay.ts'],
    },
    {
      buildType: 'bundle',
      format: 'esm',
      target: 'es2017',
      dts: false,
      input: {
        hmr: 'src/client/hmr/index.ts',
        overlay: 'src/client/overlay.ts',
      },
      externals: ['./hmr'],
      outDir: './dist/client',
      autoExtension: true,
      externalHelpers: true,
      // Skip esbuild transform and only use SWC to transform,
      // because esbuild will transform `import.meta`.
      esbuildOptions: (options) => {
        options.target = undefined;
        return options;
      },
    },
  ],
});
