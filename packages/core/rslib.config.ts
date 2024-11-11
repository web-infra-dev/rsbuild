import { defineConfig } from '@rslib/core';
import type { Configuration } from '@rspack/core';
import pkgJson from './package.json';
import prebundleConfig from './prebundle.config.mjs';

const define = {
  RSBUILD_VERSION: JSON.stringify(pkgJson.version),
};

const compiledExternals: Record<string, RegExp> = {};

for (const item of prebundleConfig.dependencies) {
  const depName = typeof item === 'string' ? item : item.name;
  compiledExternals[depName] = new RegExp(`^${depName}$`);
}

const externals: Configuration['externals'] = [
  'webpack',
  '@rspack/core',
  '@rsbuild/core',
  '@rsbuild/core/client/hmr',
  '@rsbuild/core/client/overlay',
  ({ request }, callback) => {
    const names = Object.keys(compiledExternals);
    if (request) {
      const name = names.find((name) => compiledExternals[name].test(request));
      if (name) {
        return callback(undefined, `../compiled/${name}/index.js`);
      }
    }
    callback();
  },
];

// // Annotate the CommonJS export names for ESM import in node:
// 0 && (module.exports = {
//   PLUGIN_CSS_NAME,
//   PLUGIN_SWC_NAME,
//   __internalHelper,
//   createRsbuild,
//   defineConfig,
//   ensureAssetPrefix,
//   loadConfig,
//   loadEnv,
//   logger,
//   mergeRsbuildConfig,
//   rspack,
//   version
// });

export default defineConfig({
  source: {
    define,
  },
  output: {
    target: 'node',
    externals,
    cleanDistPath: false,
  },
  lib: [
    // Node / ESM
    {
      format: 'esm',
      syntax: 'es2021',
      shims: {
        esm: {
          __filename: true,
          __dirname: true,
          require: false,
        },
      },
      dts: {
        distPath: '../dist-types',
      },
    },
    // Node / CJS
    {
      format: 'cjs',
      syntax: 'es2021',
      source: {
        entry: {
          index: './src/index.ts',
          ignoreCssLoader: './src/loader/ignoreCssLoader.ts',
          transformLoader: './src/loader/transformLoader.ts',
          transformRawLoader: './src/loader/transformRawLoader.ts',
        },
      },
    },
    // Client / ESM
    {
      format: 'esm',
      syntax: 'es2017',
      source: {
        entry: {
          hmr: 'src/client/hmr.ts',
          overlay: 'src/client/overlay.ts',
        },
        define: {
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
