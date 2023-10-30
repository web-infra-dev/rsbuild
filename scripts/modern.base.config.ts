import { defineConfig, moduleTools } from '@modern-js/module-tools';

export default defineConfig({
  plugins: [moduleTools()],
  buildConfig: {
    buildType: 'bundleless',
    format: 'cjs',
    target: 'es2019',
  },
});

export const configWithEsm = defineConfig({
  plugins: [moduleTools()],
  buildConfig: [
    {
      buildType: 'bundleless',
      format: 'cjs',
      target: 'es2019',
      outDir: './dist/cjs',
      dts: {
        distPath: '../type',
      },
    },
    {
      buildType: 'bundleless',
      format: 'esm',
      target: 'es2019',
      outDir: './dist/esm',
      dts: false,
    },
  ],
});
