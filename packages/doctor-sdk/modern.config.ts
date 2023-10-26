import { defineConfig, moduleTools } from '@modern-js/module-tools';
import baseConfig from '../../scripts/modern.base.config';

export default defineConfig({
  ...baseConfig,
  buildConfig: {
    buildType: 'bundleless',
    format: 'cjs',
    target: 'es2019',
    outDir: './dist/cjs',
    dts: {
      distPath: '../type',
    },
  },
});
