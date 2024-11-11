import fs from 'node:fs';
import path from 'node:path';
import {
  type CliPlugin,
  type ModuleTools,
  defineConfig,
  moduleTools,
} from '@modern-js/module-tools';
import prebundleConfig from './prebundle.config.mjs';

const define = {
  RSBUILD_VERSION: require('../../packages/core/package.json').version,
};

const BUILD_TARGET = {
  node: 'es2021',
  client: 'es2017',
} as const;

const requireShim = {
  // use import.meta['url'] to bypass bundle-require replacement of import.meta.url
  js: `import { createRequire } from 'module';
var require = createRequire(import.meta['url']);\n`,
};

const emitTypePkgJsonPlugin: CliPlugin<ModuleTools> = {
  name: 'emit-type-pkg-json-plugin',

  setup() {
    return {
      afterBuild() {
        const typesDir = path.join(process.cwd(), 'dist-types');
        const pkgPath = path.join(typesDir, 'package.json');
        if (!fs.existsSync(typesDir)) {
          fs.mkdirSync(typesDir);
        }
        fs.writeFileSync(
          pkgPath,
          JSON.stringify({
            '//': 'This file is for making TypeScript work with moduleResolution node16+.',
            version: '1.0.0',
          }),
          'utf8',
        );
      },
    };
  },
};

const externals = [
  'webpack',
  '@rspack/core',
  '@rsbuild/core',
  '@rsbuild/core/client/hmr',
  '@rsbuild/core/client/overlay',
  /[\\/]compiled[\\/]/,
  /node:/,
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
      format: 'esm',
      target: BUILD_TARGET.node,
      define,
      autoExtension: true,
      shims: true,
      banner: requireShim,
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
      format: 'cjs',
      target: BUILD_TARGET.node,
      define,
      autoExtension: true,
      dts: false,
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
