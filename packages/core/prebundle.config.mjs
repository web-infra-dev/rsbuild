// @ts-check
/**
 * Tip: please add the prebundled packages to `tsconfig.json#paths`.
 */
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
    typescript: 'typescript',
  },
  dependencies: [
    'open',
    'commander',
    'dotenv',
    'dotenv-expand',
    'ws',
    'on-finished',
    'connect',
    'rspack-manifest-plugin',
    {
      name: 'semver',
      ignoreDts: true,
    },
    {
      name: 'rslog',
      afterBundle(task) {
        // use the cjs bundle of rslog
        fse.copyFileSync(
          join(task.depPath, 'dist/index.cjs'),
          join(task.distPath, 'index.js'),
        );
      },
    },
    {
      name: 'jiti',
      ignoreDts: true,
    },
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
      name: 'css-loader',
      ignoreDts: true,
      externals: {
        'postcss-value-parser': '../postcss-value-parser',
        semver: '../semver',
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
        yaml: 'yaml',
        '../jiti': '../jiti',
      },
      ignoreDts: true,
      // this is a trick to avoid ncc compiling the dynamic import syntax
      // https://github.com/vercel/ncc/issues/935
      beforeBundle(task) {
        replaceFileContent(join(task.depPath, 'src/req.js'), (content) =>
          content
            .replaceAll('await import', 'await __import')
            .replaceAll(`import('jiti')`, `import('../jiti/index.js')`),
        );
      },
      afterBundle(task) {
        replaceFileContent(
          join(task.distPath, 'index.js'),
          (content) =>
            `${content.replaceAll('await __import', 'await import')}`,
        );
      },
    },
  ],
};
