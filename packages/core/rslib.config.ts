import fs from 'node:fs';
import path from 'node:path';
import { nodeMinifyConfig } from '@rsbuild/config/rslib.config.ts';
import { defineConfig, type Rsbuild, type Rspack } from '@rslib/core';
import pkgJson from './package.json' with { type: 'json' };
import prebundleConfig from './prebundle.config.ts';

export const define = {
  RSBUILD_VERSION: JSON.stringify(pkgJson.version),
  // `ws` internal env vars
  'process.env.WS_NO_BUFFER_UTIL': true,
  'process.env.WS_NO_UTF_8_VALIDATE': true,
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
  '@rspack/core',
  '@rsbuild/core',
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
        if (/jiti/.test(request)) {
          return callback(undefined, '../compiled/jiti/lib/jiti.mjs');
        }
        if (test.test(request)) {
          return callback(undefined, `../compiled/${name}/index.js`);
        }
      }
    }
    callback();
  },
];

const pluginFixDtsTypes: Rsbuild.RsbuildPlugin = {
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

// Rslib currently doesn't provide a way to preserve `__webpack_require__.*`
// references in the emitted bundle.
//
// To work around this, we use "magic" placeholder identifiers during authoring
// (e.g. `RSPACK_MODULE_HOT`, `RSPACK_INTERCEPT_MODULE_EXECUTION`) so rslib
// won't try to resolve/transform `__webpack_require__.*` at build time.
//
// After bundling, this plugin performs a plain string replacement to swap
// those placeholders back to the actual Rspack runtime globals.
const replacePlugin: Rsbuild.RsbuildPlugin = {
  name: 'replace-plugin',
  setup(api) {
    const RSPACK_MODULE_HOT = 'RSPACK_MODULE_HOT';
    const RSPACK_INTERCEPT_MODULE_EXECUTION =
      'RSPACK_INTERCEPT_MODULE_EXECUTION';

    api.processAssets(
      { stage: 'optimize-inline' },
      ({ assets, compiler, compilation, sources }) => {
        for (const name of Object.keys(assets)) {
          const asset = assets[name];
          if (!name.endsWith('.js')) {
            continue;
          }

          const source = asset.source().toString();
          if (
            !source.includes(RSPACK_MODULE_HOT) &&
            !source.includes(RSPACK_INTERCEPT_MODULE_EXECUTION)
          ) {
            continue;
          }

          const replacedSource = source
            .replaceAll(RSPACK_MODULE_HOT, 'module.hot')
            .replaceAll(
              RSPACK_INTERCEPT_MODULE_EXECUTION,
              compiler.rspack.RuntimeGlobals.interceptModuleExecution,
            );
          compilation.updateAsset(name, new sources.RawSource(replacedSource));
        }
      },
    );
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
    // Build client modules and copy dependencies to compiled folder
    {
      id: 'prepare',
      format: 'esm',
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
        copy: {
          patterns: [
            {
              from: './node_modules/jiti',
              to: path.join(import.meta.dirname, 'compiled/jiti'),
              globOptions: {
                dot: false,
              },
            },
          ],
        },
      },
      performance: {
        printFileSize: {
          exclude: (asset) => /compiled/.test(asset.name),
        },
      },
      plugins: [replacePlugin],
    },
    {
      id: 'node',
      format: 'esm',
      syntax: 'es2023',
      plugins: [pluginFixDtsTypes],
      source: {
        entry: {
          index: './src/index.ts',
          ignoreCssLoader: './src/loader/ignoreCssLoader.ts',
          transformLoader: './src/loader/transformLoader.ts',
          transformRawLoader: './src/loader/transformRawLoader.ts',
        },
      },
      dts: {
        build: true,
        // Only use tsgo in local dev for faster build, disable it in CI until it's more stable
        tsgo: !process.env.CI,
        alias: {
          // alias to pre-bundled types as they are public API
          cors: './compiled/cors',
          rslog: './compiled/rslog',
          connect: './compiled/connect',
          postcss: './compiled/postcss',
          chokidar: './compiled/chokidar',
          'rspack-chain': './compiled/rspack-chain/types',
          'html-rspack-plugin': './compiled/html-rspack-plugin',
          'http-proxy-middleware': './compiled/http-proxy-middleware',
          'rspack-manifest-plugin': './compiled/rspack-manifest-plugin',
        },
      },
      output: {
        minify: nodeMinifyConfig,
        filename: {
          js: ({ chunk }) => {
            // Use `.mjs` for Rspack loaders
            if (chunk?.name?.endsWith('Loader')) {
              return '[name].mjs';
            }
            return `[name].js`;
          },
        },
      },
      shims: {
        esm: {
          // For `postcss-load-config`
          __filename: true,
        },
      },
      tools: {
        rspack: {
          // Wait the pre compiler to copy jiti to compiled folder
          dependencies: ['prepare'],
        },
      },
    },
  ],
});
