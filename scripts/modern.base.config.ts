import { defineConfig, moduleTools } from '@modern-js/module-tools';
import path from 'path';

export default defineConfig({
  plugins: [moduleTools()],
  buildConfig: {
    buildType: 'bundleless',
    format: 'cjs',
    target: 'es2019',
  },
});

export const configWithMjs = defineConfig({
  plugins: [moduleTools()],
  buildConfig: [
    {
      format: 'cjs',
      target: 'es2019',
      autoExtension: true,
      dts: {
        respectExternal: false,
      },
    },
    {
      format: 'esm',
      target: 'es2020',
      dts: false,
      autoExtension: true,
      shims: true,
      esbuildOptions: (option) => {
        let { inject } = option;
        const filepath = path.join(__dirname, 'require_shims.js');
        if (inject) {
          inject.push(filepath);
        } else {
          inject = [filepath];
        }
        return {
          ...option,
          inject,
        };
      },
    },
  ],
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
