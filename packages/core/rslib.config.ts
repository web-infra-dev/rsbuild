import fs from 'node:fs';
import path from 'node:path';
import { nodeMinifyConfig } from '@rsbuild/config/rslib.config';
import { defineConfig } from '@rslib/core';
import type { Configuration } from '@rspack/core';
import pkgJson from './package.json';
import prebundleConfig from './prebundle.config.mjs';
import type { RsbuildPlugin } from './src';

const define = {
  RSBUILD_VERSION: JSON.stringify(pkgJson.version),
};

const regexpMap: Record<string, RegExp> = {};

for (const item of prebundleConfig.dependencies) {
  const depName = typeof item === 'string' ? item : item.name;
  regexpMap[depName] = new RegExp(`compiled[\\/]${depName}(?:[\\/]|$)`);
}

const externals: Configuration['externals'] = [
  'webpack',
  '@rspack/core',
  '@rsbuild/core',
  '@rsbuild/core/client/hmr',
  '@rsbuild/core/client/overlay',
  ({ request }, callback) => {
    const entries = Object.entries(regexpMap);
    if (request) {
      for (const [name, test] of entries) {
        if (request === name) {
          throw new Error(
            `"${name}" is not allowed to be imported, use "../compiled/${name}/index.js" instead.`,
          );
        }
        if (test.test(request)) {
          return callback(undefined, `../compiled/${name}/index.js`);
        }
      }
    }
    callback();
  },
];

const pluginFixDtsTypes: RsbuildPlugin = {
  name: 'fix-dts-types',
  setup(api) {
    api.onAfterBuild(() => {
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
    });
  },
};

export default defineConfig({
  source: {
    define,
  },
  output: {
    externals,
  },
  lib: [
    {
      id: 'esm:index',
      format: 'esm',
      syntax: 'es2021',
      plugins: [pluginFixDtsTypes],
      dts: {
        build: true,
      },
      output: {
        minify: nodeMinifyConfig,
      },
    },
    {
      id: 'esm:loaders',
      format: 'esm',
      syntax: 'es2021',
      source: {
        entry: {
          ignoreCssLoader: './src/loader/ignoreCssLoader.ts',
          transformLoader: './src/loader/transformLoader.ts',
          transformRawLoader: './src/loader/transformRawLoader.ts',
        },
      },
      output: {
        filename: {
          js: '[name].mjs',
        },
        minify: nodeMinifyConfig,
      },
    },
    {
      id: 'cjs:index',
      format: 'cjs',
      syntax: 'es2021',
      source: {
        entry: {
          index: './src/index.ts',
        },
      },
      output: {
        minify: nodeMinifyConfig,
      },
    },
    {
      id: 'esm:client',
      format: 'esm',
      syntax: 'es2017',
      source: {
        entry: {
          hmr: 'src/client/hmr.ts',
          overlay: 'src/client/overlay.ts',
        },
        define: {
          // use define to avoid compile time evaluation of __webpack_hash__
          WEBPACK_HASH: '__webpack_hash__',
        },
      },
      output: {
        target: 'web',
        externals: ['./hmr'],
        distPath: {
          root: './dist/client',
        },
      },
    },
  ],
});
