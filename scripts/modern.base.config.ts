import {
  defineConfig,
  moduleTools,
  type PartialBaseBuildConfig,
} from '@modern-js/module-tools';

const define = {
  RSBUILD_VERSION: require('../packages/core/package.json').version,
};

const BUILD_TARGET = 'es2020' as const;

const requireShim = {
  // use import.meta['url'] to bypass bundle-require replacement of import.meta.url
  js: `import { createRequire } from 'module';
var require = createRequire(import.meta['url']);\n`,
};

export const baseBuildConfig = defineConfig({
  plugins: [moduleTools()],
  buildConfig: {
    buildType: 'bundleless',
    format: 'cjs',
    target: BUILD_TARGET,
    define,
  },
});

export const bundleMjsOnlyConfig = defineConfig({
  plugins: [moduleTools()],
  buildConfig: {
    buildType: 'bundle',
    format: 'esm',
    target: BUILD_TARGET,
    define,
    autoExtension: true,
    shims: true,
    banner: requireShim,
  },
});

export default baseBuildConfig;

const externals = ['@rsbuild/core', /[\\/]compiled[\\/]/];

export const buildConfigWithMjs: PartialBaseBuildConfig[] = [
  {
    format: 'cjs',
    target: BUILD_TARGET,
    define,
    autoExtension: true,
    externals,
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
    externals,
    banner: requireShim,
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
