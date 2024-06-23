import fs from 'node:fs';
// @ts-check
import { join } from 'node:path';

function replaceFileContent(filePath, replaceFn) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const newContent = replaceFn(content);
  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent);
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
    'deepmerge',
    {
      name: 'chokidar',
      externals: {
        fsevents: 'fsevents',
      },
    },
    'webpack-merge',
    'gzip-size',
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
        deepmerge: '../deepmerge',
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
      externals: {
        'gzip-size': '../gzip-size',
      },
    },
    {
      name: 'autoprefixer',
      externals: {
        picocolors: '../picocolors',
        browserslist: '../browserslist',
        // Can be enabled after moving to core
        // 'postcss-value-parser': '../postcss-value-parser',
      },
    },
  ],
};
