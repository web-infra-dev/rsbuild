import path, { join } from 'node:path';
import fs, { copySync } from 'fs-extra';
import { replaceFileContent } from './helper';
import type { ParsedTask, TaskConfig } from './types';

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

const writeEmptySchemaUtils = (task: ParsedTask) => {
  // The package size of `schema-utils` is large, and validate has a performance overhead of tens of ms.
  // So we skip the validation and let TypeScript to ensure type safety.
  const schemaUtilsPath = join(task.distPath, 'schema-utils.js');
  fs.outputFileSync(schemaUtilsPath, 'module.exports.validate = () => {};');
};

export const TASKS: TaskConfig[] = [
  {
    packageDir: 'core',
    packageName: '@rsbuild/core',
    dependencies: [
      'open',
      'commander',
      'dotenv',
      'dotenv-expand',
      'ws',
      'on-finished',
      {
        name: 'launch-editor-middleware',
        ignoreDts: true,
        externals: {
          picocolors: '@rsbuild/shared/picocolors',
        },
      },
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
    ],
  },
  {
    packageDir: 'shared',
    packageName: '@rsbuild/shared',
    dependencies: [
      'jiti',
      'rslog',
      'deepmerge',
      'fs-extra',
      'chokidar',
      'webpack-merge',
      'mime-types',
      'connect',
      'browserslist',
      'gzip-size',
      'json5',
      {
        name: 'webpack-chain',
        externals: {
          deepmerge: '../deepmerge',
        },
      },
      {
        name: 'yaml',
        ignoreDts: true,
        afterBundle(task) {
          fs.writeFileSync(
            join(task.distPath, 'index.d.ts'),
            'export declare function parse(src: string, options?: any): any;',
          );
        },
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
        name: 'icss-utils',
        ignoreDts: true,
      },
      {
        name: 'postcss-value-parser',
        ignoreDts: true,
      },
      {
        name: 'postcss-modules-local-by-default',
        ignoreDts: true,
        externals: {
          'icss-utils': '../icss-utils',
          'postcss-value-parser': '../postcss-value-parser',
        },
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
        externals: {
          'icss-utils': '../icss-utils',
        },
      },
      {
        name: 'sass-loader',
        externals: {
          sass: '../sass',
        },
      },
      {
        name: 'sass',
        externals: {
          chokidar: '../chokidar',
        },
        afterBundle(task) {
          copySync(join(task.depPath, 'types'), join(task.distPath, 'types'));
        },
      },
      {
        name: 'style-loader',
        ignoreDts: true,
        afterBundle: (task) => {
          fs.copySync(
            join(task.depPath, 'dist/runtime'),
            join(task.distPath, 'runtime'),
          );
        },
      },
      {
        name: 'less',
        externals: {
          // needle is an optional dependency and no need to bundle it.
          needle: 'needle',
        },
        afterBundle(task) {
          replaceFileContent(join(task.distPath, 'index.d.ts'), (content) =>
            content.replace(
              `declare module "less" {\n    export = less;\n}`,
              'export = Less;',
            ),
          );
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
        name: 'css-loader',
        ignoreDts: true,
        externals: {
          semver: '../semver',
          'postcss-value-parser': '../postcss-value-parser',
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
            join(task.depPath, 'src/req.js'),
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
        name: 'resolve-url-loader',
        ignoreDts: true,
        externals: {
          'loader-utils': '../loader-utils2',
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
        afterBundle: writeEmptySchemaUtils,
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
        afterBundle: writeEmptySchemaUtils,
      },
    ],
  },
  {
    packageDir: 'plugin-svgr',
    packageName: '@rsbuild/plugin-svgr',
    dependencies: [
      {
        name: 'file-loader',
        ignoreDts: true,
        externals: {
          'schema-utils': './schema-utils',
          'loader-utils': '@rsbuild/shared/loader-utils2',
        },
        afterBundle: writeEmptySchemaUtils,
      },
      {
        name: 'url-loader',
        ignoreDts: true,
        externals: {
          'schema-utils': './schema-utils',
          'loader-utils': '@rsbuild/shared/loader-utils2',
          'mime-types': '@rsbuild/shared/mime-types',
        },
        afterBundle(task) {
          writeEmptySchemaUtils(task);
          replaceFileContent(join(task.distPath, 'index.js'), (content) => {
            // use prebundle file-loader
            return content.replace(
              '"file-loader"',
              'require.resolve("../file-loader")',
            );
          });
        },
      },
    ],
  },
  {
    packageDir: 'plugin-yaml',
    packageName: '@rsbuild/plugin-yaml',
    dependencies: [
      {
        name: 'yaml-loader',
        ignoreDts: true,
      },
    ],
  },
  {
    packageDir: 'plugin-rem',
    packageName: '@rsbuild/plugin-rem',
    dependencies: [
      {
        name: 'postcss-pxtorem',
        ignoreDts: true,
      },
    ],
  },
];
