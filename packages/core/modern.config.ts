import { defineConfig, moduleTools } from '@modern-js/module-tools';
import {
  BUILD_TARGET,
  cjsBuildConfig,
  commonExternals,
  emitTypePkgJsonPlugin,
  esmBuildConfig,
} from '@rsbuild/config/modern.config.ts';
import prebundleConfig from './prebundle.config.mjs';

const externals = [
  ...commonExternals,
  '@rsbuild/core/client/hmr',
  '@rsbuild/core/client/overlay',
];

const aliasCompiledPlugin = {
  name: 'alias-compiled-plugin',
  setup(build) {
    const { dependencies } = prebundleConfig;
    for (const item of dependencies) {
      const depName = typeof item === 'string' ? item : item.name;
      build.onResolve({ filter: new RegExp(`^${depName}$`) }, () => ({
        path: `../compiled/${depName}/index.js`,
        external: true,
      }));
    }
  },
};

export default defineConfig({
  plugins: [moduleTools(), emitTypePkgJsonPlugin],
  buildConfig: [
    // Node / ESM
    {
      ...esmBuildConfig,
      input: ['src/index.ts'],
      externals,
      dts: false,
      esbuildOptions(options) {
        options.plugins?.unshift(aliasCompiledPlugin);
        return options;
      },
    },
    // Node / CJS
    {
      ...cjsBuildConfig,
      input: [
        'src/index.ts',
        'src/loader/ignoreCssLoader.ts',
        'src/loader/transformLoader.ts',
        'src/loader/transformRawLoader.ts',
      ],
      externals,
      esbuildOptions(options) {
        options.plugins?.unshift(aliasCompiledPlugin);
        return options;
      },
    },
    // Client / ESM
    {
      format: 'esm',
      input: {
        hmr: 'src/client/hmr.ts',
        overlay: 'src/client/overlay.ts',
      },
      target: BUILD_TARGET.client,
      dts: false,
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
    // Types
    {
      externals,
      buildType: 'bundleless',
      dts: {
        distPath: '../dist-types',
        only: true,
      },
    },
  ],
});
