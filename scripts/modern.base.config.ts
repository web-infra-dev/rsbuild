import {
  defineConfig,
  moduleTools,
  PartialBaseBuildConfig,
} from '@modern-js/module-tools';
import path from 'path';

export const baseBuildConfig = {
  plugins: [moduleTools()],
  buildConfig: {
    buildType: 'bundleless' as const,
    format: 'cjs' as const,
    target: 'es2019' as const,
  },
};

export default defineConfig(baseBuildConfig);

export const buildConfigWithMjs: PartialBaseBuildConfig[] = [
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
];

export const configWithMjs = defineConfig({
  plugins: [moduleTools()],
  buildConfig: buildConfigWithMjs,
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
