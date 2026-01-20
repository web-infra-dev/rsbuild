import fs from 'node:fs';
import path from 'node:path';
import { nodeMinifyConfig } from '@rsbuild/config/rslib.config.ts';
import { defineConfig, type Rspack, type rsbuild } from '@rslib/core';
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

class RspackRuntimeReplacePlugin {
  static readonly pluginName = 'RspackRuntimeReplacePlugin';

  apply(compiler: Rspack.Compiler) {
    const RSPACK_MODULE_HOT = 'RSPACK_MODULE_HOT';
    const RSPACK_INTERCEPT_MODULE_EXECUTION =
      'RSPACK_INTERCEPT_MODULE_EXECUTION';

    const { Compilation, RuntimeGlobals, sources } = compiler.rspack;

    compiler.hooks.thisCompilation.tap(
      RspackRuntimeReplacePlugin.pluginName,
      (compilation) => {
        compilation.hooks.processAssets.tap(
          {
            name: RspackRuntimeReplacePlugin.pluginName,
            stage: Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_INLINE,
          },
          (assets) => {
            for (const name in assets) {
              const asset = assets[name];
              if (name.endsWith('.js')) {
                const source = asset.source();
                if (
                  source.includes(RSPACK_MODULE_HOT) ||
                  source.includes(RSPACK_INTERCEPT_MODULE_EXECUTION)
                ) {
                  const replacedSource = source
                    .replaceAll(RSPACK_MODULE_HOT, 'module.hot')
                    .replaceAll(
                      RSPACK_INTERCEPT_MODULE_EXECUTION,
                      RuntimeGlobals.interceptModuleExecution,
                    );
                  compilation.updateAsset(
                    name,
                    new sources.RawSource(replacedSource),
                  );
                }
              }
            }
          },
        );
      },
    );
  }
}

export default defineConfig({
  source: {
    define,
  },
  output: {
    externals,
  },
  lib: [
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
          rslog: './compiled/rslog',
          'rspack-chain': './compiled/rspack-chain/types',
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
    },
    {
      id: 'client',
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
      tools: {
        rspack(config) {
          config.plugins.push(new RspackRuntimeReplacePlugin());
          return config;
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
