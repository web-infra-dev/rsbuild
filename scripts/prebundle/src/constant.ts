import path, { join } from 'path';
import type { TaskConfig } from './types';
import fs from 'fs-extra';
import { replaceFileContent } from './helper';

export const ROOT_DIR = join(__dirname, '..', '..', '..');
export const PACKAGES_DIR = join(ROOT_DIR, 'packages');
export const DIST_DIR = 'compiled';

export const DEFAULT_EXTERNALS = {
  // External caniuse-lite data, so users can update it manually.
  'caniuse-lite': 'caniuse-lite',
  '/^caniuse-lite(/.*)/': 'caniuse-lite$1',
  // External webpack, it's hard to bundle.
  webpack: 'webpack',
  '/^webpack(/.*)/': 'webpack$1',
  // External lodash because lots of packages will depend on it.
  lodash: 'lodash',
  '/^lodash(/.*)/': 'lodash$1',
  esbuild: 'esbuild',
  // ncc bundled wrong package.json, using external to avoid this problem
  './package.json': './package.json',
  '../package.json': './package.json',
  '../../package.json': './package.json',
  postcss: 'postcss',
  typescript: 'typescript',
  '@babel/core': '@babel/core',
};

export const TASKS: TaskConfig[] = [
  {
    packageDir: 'core',
    packageName: '@rsbuild/core',
    dependencies: [
      'open',
      'dotenv',
      'dotenv-expand',
      'ws',
      {
        name: 'sirv',
        afterBundle(task) {
          replaceFileContent(
            join(task.distPath, 'sirv.d.ts'),
            (content) =>
              `${content.replace(
                "declare module 'sirv'",
                'declare namespace sirv',
              )}\nexport = sirv;`,
          );
        },
      },
      {
        name: 'http-compression',
        ignoreDts: true,
      },
      {
        name: 'connect-history-api-fallback',
        ignoreDts: true,
      },
      {
        name: 'toml-loader',
        ignoreDts: true,
      },
    ],
  },
  {
    packageDir: 'shared',
    packageName: '@rsbuild/shared',
    dependencies: [
      'jiti',
      'rslog',
      'commander',
      'deepmerge',
      'fs-extra',
      'chokidar',
      'webpack-chain',
      'mime-types',
      'connect',
      'browserslist',
      'gzip-size',
      'json5',
      {
        name: 'yaml',
        ignoreDts: true,
      },
      {
        name: 'line-diff',
        ignoreDts: true,
      },
      {
        name: 'semver',
        ignoreDts: true,
      },
      {
        name: 'webpack-sources',
        ignoreDts: true,
      },
      {
        name: 'postcss-value-parser',
        ignoreDts: true,
      },
      {
        name: 'postcss-modules-local-by-default',
        ignoreDts: true,
      },
      {
        name: 'postcss-modules-extract-imports',
        ignoreDts: true,
      },
      {
        name: 'postcss-modules-scope',
        ignoreDts: true,
      },
      {
        name: 'postcss-modules-values',
        ignoreDts: true,
      },
      {
        name: 'icss-utils',
        ignoreDts: true,
      },
      {
        name: 'sass-loader',
        externals: {
          sass: '../sass',
        },
      },
      {
        name: 'less-loader',
        ignoreDts: true,
        externals: {
          less: '../less',
        },
      },
      {
        name: 'yaml-loader',
        ignoreDts: true,
        externals: {
          yaml: '../yaml',
          'loader-utils': '../loader-utils2',
        },
      },
      {
        name: 'css-loader',
        ignoreDts: true,
        externals: {
          semver: '../semver',
          'postcss-modules-local-by-default':
            '../postcss-modules-local-by-default',
          'postcss-modules-extract-imports':
            '../postcss-modules-extract-imports',
          'postcss-modules-scope': '../postcss-modules-scope',
          'postcss-modules-values': '../postcss-modules-values',
          'icss-utils': '../icss-utils',
        },
      },
      {
        name: 'postcss-loader',
        externals: {
          jiti: '../jiti',
          semver: '../semver',
        },
        ignoreDts: true,
      },
      {
        name: 'postcss-load-config',
        externals: {
          jiti: '../jiti',
          yaml: '../yaml',
        },
        ignoreDts: true,
        // this is a trick to avoid ncc compiling the dynamic import syntax
        // https://github.com/vercel/ncc/issues/935
        beforeBundle(task) {
          replaceFileContent(
            join(task.depPath, 'src/index.js'),
            (content) => `${content.replace('await import', 'await __import')}`,
          );
        },
        afterBundle(task) {
          replaceFileContent(
            join(task.distPath, 'index.js'),
            (content) => `${content.replace('await __import', 'await import')}`,
          );
        },
      },
      {
        name: 'loader-utils2',
        ignoreDts: true,
        externals: {
          json5: '../json5',
        },
      },
      {
        name: 'picocolors',
        beforeBundle({ depPath }) {
          const typesFile = path.join(depPath, 'types.ts');
          // Fix type bundle
          if (fs.existsSync(typesFile)) {
            fs.renameSync(typesFile, path.join(depPath, 'types.d.ts'));
          }
        },
      },
      {
        name: 'webpack-dev-middleware',
        externals: {
          'schema-utils': './schema-utils',
          'schema-utils/declarations/validate':
            'schema-utils/declarations/validate',
          'mime-types': '../mime-types',
        },
        afterBundle(task) {
          // The package size of `schema-utils` is large, and validate has a performance overhead of tens of ms.
          // So we skip the validation and let TypeScript to ensure type safety.
          const schemaUtilsPath = join(task.distPath, 'schema-utils.js');
          fs.outputFileSync(
            schemaUtilsPath,
            'module.exports.validate = () => {};',
          );
        },
      },
      {
        name: 'autoprefixer',
        externals: {
          picocolors: '../picocolors',
          browserslist: '../browserslist',
          'postcss-value-parser': '../postcss-value-parser',
        },
      },
      {
        name: 'http-proxy-middleware',
        externals: {
          // express is a peer dependency, no need to provide express type
          express: 'express',
        },
      },
      {
        // The webpack-bundle-analyzer version was locked to v4.9.0 to be compatible with Rspack
        // If we need to upgrade the version, please check if the chunk detail can be displayed correctly
        name: 'webpack-bundle-analyzer',
        externals: {
          commander: '../commander',
          'gzip-size': '../gzip-size',
        },
      },
    ],
  },
  {
    packageDir: 'plugin-babel',
    packageName: '@rsbuild/plugin-babel',
    dependencies: [
      {
        name: 'babel-loader',
        ignoreDts: true,
        externals: {
          'schema-utils': './schema-utils',
        },
        afterBundle(task) {
          // The package size of `schema-utils` is large, and validate has a performance overhead of tens of ms.
          // So we skip the validation and let TypeScript to ensure type safety.
          const schemaUtilsPath = join(task.distPath, 'schema-utils.js');
          fs.outputFileSync(
            schemaUtilsPath,
            'module.exports.validate = () => {};',
          );
        },
      },
    ],
  },
];
