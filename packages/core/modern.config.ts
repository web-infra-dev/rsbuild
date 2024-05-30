import {
  type HookList,
  defineConfig,
  moduleTools,
} from '@modern-js/module-tools';
import {
  BUILD_TARGET,
  cjsBuildConfig,
  commonExternals,
  emitTypePkgJsonPlugin,
  esmBuildConfig,
} from '@rsbuild/config/modern';

const externals = [
  ...commonExternals,
  '@rsbuild/core/client/hmr',
  '@rsbuild/core/client/overlay',
];

/** T[] => T */
type GetElementType<T extends any[]> = T extends (infer U)[] ? U : never;

// Since the relative paths of bundle and compiled have changed,
// we need to rewrite the import paths.
export const redirectCompiledHook: GetElementType<HookList> = {
  name: 'redirect-compiled',
  apply: (compiler) => {
    compiler.hooks.transform.tapPromise('redirect-compiled', async (args) => {
      return {
        ...args,
        code: args.code.replace(/(\.\.\/){2,3}compiled/g, '../compiled'),
      };
    });
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
      hooks: [redirectCompiledHook],
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
      hooks: [redirectCompiledHook],
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
