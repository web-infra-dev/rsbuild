import { defineConfig } from '@modern-js/module-tools';
import baseConfig from '../../scripts/modern.base.config';

export default defineConfig({
  ...baseConfig,
  buildConfig: {
    buildType: 'bundleless',
    format: 'esm',
    target: 'esnext',
    outDir: './dist/esm',
    dts: {
      distPath: '../type',
    },
  },
});
