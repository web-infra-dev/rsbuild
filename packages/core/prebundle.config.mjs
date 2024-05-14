// @ts-check
import { join } from 'node:path';
import fse from 'fs-extra';

// The package size of `schema-utils` is large, and validate has a performance overhead of tens of ms.
// So we skip the validation and let TypeScript to ensure type safety.
const writeEmptySchemaUtils = (task) => {
  const schemaUtilsPath = join(task.distPath, 'schema-utils.js');
  fse.writeFileSync(schemaUtilsPath, 'module.exports.validate = () => {};');
};

function replaceFileContent(filePath, replaceFn) {
  const content = fse.readFileSync(filePath, 'utf-8');
  const newContent = replaceFn(content);
  if (newContent !== content) {
    fse.writeFileSync(filePath, newContent);
  }
}

/** @type {import('prebundle').Config} */
export default {
  externals: {
    // External caniuse-lite data, so users can update it manually.
    'caniuse-lite': 'caniuse-lite',
    '/^caniuse-lite(/.*)/': 'caniuse-lite$1',
    webpack: 'webpack',
    postcss: 'postcss',
  },
  dependencies: [
    'open',
    'commander',
    'dotenv',
    'dotenv-expand',
    'ws',
    'on-finished',
    'rspack-manifest-plugin',
    {
      name: 'launch-editor-middleware',
      ignoreDts: true,
      externals: {
        picocolors: '@rsbuild/shared/picocolors',
      },
    },
    {
      name: 'postcss-value-parser',
      ignoreDts: true,
    },
    {
      name: 'sirv',
      ignoreDts: true,
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
      name: 'webpack-dev-middleware',
      externals: {
        'schema-utils': './schema-utils',
        'schema-utils/declarations/validate':
          'schema-utils/declarations/validate',
        'mime-types': '@rsbuild/shared/mime-types',
      },
      ignoreDts: true,
      afterBundle: writeEmptySchemaUtils,
    },
    {
      name: 'style-loader',
      ignoreDts: true,
      afterBundle: (task) => {
        fse.copySync(
          join(task.depPath, 'dist/runtime'),
          join(task.distPath, 'runtime'),
        );
      },
    },
    {
      name: 'less-loader',
      ignoreDts: true,
      externals: {
        less: '@rsbuild/shared/less',
      },
    },
    {
      name: 'css-loader',
      ignoreDts: true,
      externals: {
        'postcss-value-parser': '../postcss-value-parser',
        semver: '@rsbuild/shared/semver',
        'postcss-modules-local-by-default':
          '@rsbuild/shared/postcss-modules-local-by-default',
        'postcss-modules-extract-imports':
          '@rsbuild/shared/postcss-modules-extract-imports',
        'postcss-modules-scope': '@rsbuild/shared/postcss-modules-scope',
        'postcss-modules-values': '@rsbuild/shared/postcss-modules-values',
        'icss-utils': '@rsbuild/shared/icss-utils',
      },
    },
    {
      name: 'postcss-loader',
      externals: {
        jiti: '@rsbuild/shared/jiti',
        semver: '@rsbuild/shared/semver',
      },
      ignoreDts: true,
    },
    {
      name: 'postcss-load-config',
      externals: {
        jiti: '@rsbuild/shared/jiti',
        yaml: '@rsbuild/shared/yaml',
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
      name: 'resolve-url-loader',
      ignoreDts: true,
      externals: {
        'loader-utils': '@rsbuild/shared/loader-utils2',
      },
    },
  ],
};
