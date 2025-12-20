import fs from 'node:fs';
import path from 'node:path';
import { nodeMinifyConfig } from '@rsbuild/config/rslib.config.ts';
import type { Rspack, rsbuild } from '@rslib/core';
import { defineConfig } from '@rslib/core';
import pkgJson from './package.json' with { type: 'json' };
import prebundleConfig from './prebundle.config.ts';

export const define = {
  RSBUILD_VERSION: JSON.stringify(pkgJson.version),
};

const regexpMap: Record<string, RegExp> = {};

for (const item of prebundleConfig.dependencies) {
  const depName = typeof item === 'string' ? item : item.name;

  // Skip dtsOnly dependencies
  if (typeof item !== 'string' && item.dtsOnly) {
    continue;
  }

  regexpMap[depName] = new RegExp(`compiled[\\/]${depName}(?:[\\/]|$)`);
}

const externals: Rspack.Configuration['externals'] = [
  'webpack',
  '@rspack/core',
  '@rsbuild/core',
  '@rsbuild/core/client/hmr',
  '@rsbuild/core/client/overlay',
  // yaml and tsx are optional dependencies of `postcss-load-config`
  'yaml',
  'tsx/cjs/api',
  // externalize pre-bundled dependencies
  ({ request }, callback) => {
    const entries = Object.entries(regexpMap);
    if (request) {
      for (const [name, test] of entries) {
        if (request === name) {
          throw new Error(
            `"${name}" is not allowed to be imported, use "requireCompiledPackage" instead.`,
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

const pluginFixDtsTypes: rsbuild.RsbuildPlugin = {
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
      id: 'esm_index',
      format: 'esm',
      experiments: {
        advancedEsm: true,
      },
      syntax: 'es2022',
      plugins: [pluginFixDtsTypes],
      dts: {
        build: true,
        // Only use tsgo in local dev for faster build, disable it in CI until it's more stable
        tsgo: !process.env.CI,
        alias: {
          // alias to pre-bundled types as they are public API
          rslog: './compiled/rslog',
          'rspack-chain': './compiled/rspack-chain/types',
        },
      },
      output: {
        minify: nodeMinifyConfig,
      },
      shims: {
        esm: {
          // For `postcss-load-config`
          __filename: true,
        },
      },
    },
    {
      id: 'esm_loaders',
      format: 'esm',
      experiments: {
        advancedEsm: true,
      },
      syntax: 'es2022',
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
      id: 'cjs_index',
      format: 'cjs',
      syntax: 'es2022',
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
      id: 'esm_client',
      format: 'esm',
      experiments: {
        advancedEsm: true,
      },
      syntax: 'es2017',
      source: {
        entry: {
          hmr: 'src/client/hmr.ts',
          overlay: 'src/client/overlay.ts',
        },
        define: {
          // use define to avoid compile time evaluation of __webpack_hash__
          BUILD_HASH: '__webpack_hash__',
        },
      },
      output: {
        target: 'web',
        externals: ['./hmr.js'],
        distPath: {
          root: './dist/client',
        },
      },
    },
  ],
});
