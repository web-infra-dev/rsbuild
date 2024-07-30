import fs from 'node:fs';
// @ts-check
/**
 * Tip: please add the prebundled packages to `tsconfig.json#paths`.
 */
import { join } from 'node:path';

// The package size of `schema-utils` is large, and validate has a performance overhead of tens of ms.
// So we skip the validation and let TypeScript to ensure type safety.
const writeEmptySchemaUtils = (task) => {
  const schemaUtilsPath = join(task.distPath, 'schema-utils.js');
  fs.writeFileSync(schemaUtilsPath, 'module.exports.validate = () => {};');
};

// postcss-loader and css-loader use `semver` to compare PostCSS ast version,
// Rsbuild uses the same PostCSS version and do not need the comparison.
const writeEmptySemver = (task) => {
  const schemaUtilsPath = join(task.distPath, 'semver.js');
  fs.writeFileSync(schemaUtilsPath, 'module.exports.satisfies = () => true;');
};

function replaceFileContent(filePath, replaceFn) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const newContent = replaceFn(content);
  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent);
  }
}

/** @type {import('prebundle').Config} */
export default {
  prettier: true,
  externals: {
    // External caniuse-lite data, so users can update it manually.
    'caniuse-lite': 'caniuse-lite',
    '/^caniuse-lite(/.*)/': 'caniuse-lite$1',
    '@rspack/core': '@rspack/core',
    '@rspack/lite-tapable': '@rspack/lite-tapable',
    webpack: 'webpack',
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
    'webpack-merge',
    'html-rspack-plugin',
    {
      name: 'chokidar',
      externals: {
        fsevents: 'fsevents',
      },
    },
    {
      name: 'picocolors',
      beforeBundle({ depPath }) {
        const typesFile = join(depPath, 'types.ts');
        // Fix type bundle
        if (fs.existsSync(typesFile)) {
          fs.renameSync(typesFile, join(depPath, 'types.d.ts'));
        }
      },
    },
    {
      name: 'rslog',
      afterBundle(task) {
        // use the cjs bundle of rslog
        fs.copyFileSync(
          join(task.depPath, 'dist/index.cjs'),
          join(task.distPath, 'index.js'),
        );
      },
    },
    {
      name: 'jiti',
      // jiti has been minified, we do not need to prettier it
      prettier: false,
      ignoreDts: true,
    },
    {
      name: 'launch-editor-middleware',
      ignoreDts: true,
      externals: {
        picocolors: '../picocolors',
      },
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
      name: 'browserslist',
      // preserve the `require(require.resolve())`
      beforeBundle(task) {
        replaceFileContent(join(task.depPath, 'node.js'), (content) =>
          content.replaceAll(
            'require(require.resolve',
            'eval("require")(require.resolve',
          ),
        );
      },
    },
    {
      name: 'rspack-chain',
      externals: {
        '@rspack/core': '@rspack/core',
      },
    },
    {
      name: 'http-proxy-middleware',
      externals: {
        // express is a peer dependency, no need to provide express type
        express: 'express',
      },
      beforeBundle(task) {
        replaceFileContent(
          join(task.depPath, 'dist/types.d.ts'),
          (content) =>
            `${content.replace(
              "import type * as httpProxy from 'http-proxy'",
              "import type httpProxy from 'http-proxy'",
            )}`,
        );
      },
    },
    {
      // The webpack-bundle-analyzer version was locked to v4.9.0 to be compatible with Rspack
      // If we need to upgrade the version, please check if the chunk detail can be displayed correctly
      name: 'webpack-bundle-analyzer',
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
        fs.cpSync(
          join(task.depPath, 'dist/runtime'),
          join(task.distPath, 'runtime'),
          { recursive: true },
        );
      },
    },
    {
      name: 'css-loader',
      ignoreDts: true,
      externals: {
        semver: './semver',
        picocolors: '../picocolors',
      },
      afterBundle: writeEmptySemver,
    },
    {
      name: 'postcss-loader',
      externals: {
        jiti: '../jiti',
        semver: './semver',
      },
      ignoreDts: true,
      beforeBundle(task) {
        replaceFileContent(join(task.depPath, 'dist/utils.js'), (content) =>
          // Rsbuild uses `postcss-load-config` and no need to use `cosmiconfig`.
          // the ralevent code will never be executed, so we can replace it with an empty object.
          content.replaceAll('require("cosmiconfig")', '{}'),
        );
      },
      afterBundle: writeEmptySemver,
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
