import {
  defineConfig,
  moduleTools,
  PartialBaseBuildConfig,
} from '@modern-js/module-tools';
import path from 'path';

const define = {
  RSBUILD_VERSION: require('../packages/core/package.json').version,
};

const BUILD_TARGET = 'es2020' as const;

export const baseBuildConfig = {
  plugins: [moduleTools()],
  buildConfig: {
    buildType: 'bundleless' as const,
    format: 'cjs' as const,
    target: BUILD_TARGET,
    define,
  },
};

export default defineConfig(baseBuildConfig);

export const buildConfigWithMjs: PartialBaseBuildConfig[] = [
  {
    format: 'cjs',
    target: BUILD_TARGET,
    define,
    autoExtension: true,
    dts: {
      respectExternal: false,
    },
  },
  {
    format: 'esm',
    target: BUILD_TARGET,
    dts: false,
    define,
    autoExtension: true,
    shims: true,
    esbuildOptions: (option) => {
      let { inject } = option;
      const filepath = path.join(__dirname, 'requireShims.js');
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
      target: BUILD_TARGET,
      outDir: './dist/cjs',
      dts: {
        distPath: '../type',
      },
    },
    {
      buildType: 'bundleless',
      format: 'esm',
      target: BUILD_TARGET,
      outDir: './dist/esm',
      dts: false,
    },
  ],
});
