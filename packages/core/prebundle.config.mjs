import fs from 'node:fs';
// @ts-check
/**
 * Tip: please add the prebundled packages to `tsconfig.json#paths`.
 */
import { join } from 'node:path';

function replaceFileContent(filePath, replaceFn) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const newContent = replaceFn(content);
  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent);
  }
}

// postcss-loader and css-loader use `semver` to compare PostCSS ast version,
// Rsbuild uses the same PostCSS version and do not need the comparison.
const skipSemver = (task) => {
  replaceFileContent(join(task.depPath, 'dist/index.js'), (content) =>
    content.replaceAll('require("semver")', '({ satisfies: () => true })'),
  );
};

/** @type {import('prebundle').Config} */
export default {
  prettier: true,
  externals: {
    '@rspack/core': '@rspack/core',
    '@rspack/lite-tapable': '@rspack/lite-tapable',
    webpack: 'webpack',
    typescript: 'typescript',
  },
  dependencies: [
    'open',
    'ws',
    'on-finished',
    'connect',
    'rspack-manifest-plugin',
    'webpack-merge',
    'html-rspack-plugin',
    'mrmime',
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
      name: 'connect-history-api-fallback',
      ignoreDts: true,
    },
    {
      name: 'rspack-chain',
      externals: {
        '@rspack/core': '@rspack/core',
      },
      ignoreDts: true,
      afterBundle(task) {
        // copy types to dist because prebundle will break the types
        fs.cpSync(
          join(task.depPath, 'types/index.d.ts'),
          join(task.distPath, 'index.d.ts'),
        );
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
      name: 'rsbuild-dev-middleware',
      externals: {
        mrmime: '../mrmime',
      },
      ignoreDts: true,
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
      name: 'postcss',
      ignoreDts: true,
      externals: {
        picocolors: '../picocolors',
      },
    },
    {
      name: 'css-loader',
      ignoreDts: true,
      externals: {
        semver: './semver',
        postcss: '../postcss',
      },
      beforeBundle: skipSemver,
    },
    {
      name: 'postcss-loader',
      externals: {
        jiti: '../jiti',
        semver: './semver',
        postcss: '../postcss',
      },
      ignoreDts: true,
      beforeBundle(task) {
        replaceFileContent(join(task.depPath, 'dist/utils.js'), (content) =>
          // Rsbuild uses `postcss-load-config` and no need to use `cosmiconfig`.
          // the ralevent code will never be executed, so we can replace it with an empty object.
          content.replaceAll('require("cosmiconfig")', '{}'),
        );
        skipSemver(task);
      },
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
