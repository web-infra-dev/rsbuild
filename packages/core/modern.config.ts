import fs from 'node:fs';
import path from 'node:path';
import {
  type CliPlugin,
  type ModuleTools,
  defineConfig,
  moduleTools,
} from '@modern-js/module-tools';
import {
  BUILD_TARGET,
  cjsBuildConfig,
  commonExternals,
  emitTypePkgJsonPlugin,
  esmBuildConfig,
} from '../../scripts/modern.base.config';

const externals = [
  ...commonExternals,
  '@rsbuild/core/client/hmr',
  '@rsbuild/core/client/overlay',
];

// Since the relative paths of bundle and compiled have changed,
// we need to rewrite the import paths.
export const redirectCompiledPlugin: CliPlugin<ModuleTools> = {
  name: 'redirect-compiled-plugin',
  setup() {
    return {
      afterBuild() {
        const distFiles = [
          path.join(__dirname, 'dist/index.js'),
          path.join(__dirname, 'dist/index.cjs'),
        ];

        for (const file of distFiles) {
          let content = fs.readFileSync(file, 'utf-8');
          content = content.replace(/(\.\.\/){2,3}compiled/g, '../compiled');
          fs.writeFileSync(file, content);
        }
      },
    };
  },
};

export default defineConfig({
  plugins: [moduleTools(), emitTypePkgJsonPlugin, redirectCompiledPlugin],
  buildConfig: [
    // Node / ESM
    {
      ...esmBuildConfig,
      input: ['src/index.ts'],
      externals,
      dts: false,
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
