// @ts-check
import fs from 'node:fs';
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
  prettier: true,
  externals: {
    '@rspack/core': '@rspack/core',
    '@rspack/lite-tapable': '@rspack/lite-tapable',
    typescript: 'typescript',
  },
  dependencies: [
    'ws',
    'on-finished',
    'connect',
    'rspack-manifest-plugin',
    'html-rspack-plugin',
    'mrmime',
    'tinyglobby',
    'chokidar',
    'cors',
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
      name: 'rspack-chain',
      copyDts: true,
      dtsOnly: true,
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
      afterBundle(task) {
        replaceFileContent(
          join(task.distPath, 'index.d.ts'),
          (content) =>
            // TODO: Due to the breaking change of http-proxy-middleware, it needs to be upgraded in rsbuild 2.0
            // https://github.com/chimurai/http-proxy-middleware/pull/730
            `${content
              .replace('express.Request', 'http.IncomingMessage')
              .replace('express.Response', 'http.ServerResponse')
              .replace("import * as express from 'express';", '')
              .replace(
                'extends express.RequestHandler {',
                `{
  (req: Request, res: Response, next?: (err?: any) => void): void | Promise<void>;`,
              )}`,
        );
      },
    },
    {
      name: 'webpack-bundle-analyzer',
      minify: true,
      externals: {
        webpack: 'webpack',
      },
      afterBundle(task) {
        // webpack type does not exist, use `@rspack/core` instead
        replaceFileContent(join(task.distPath, 'index.d.ts'), (content) =>
          content.replace("from 'webpack'", 'from "@rspack/core"'),
        );
      },
    },
    {
      name: 'rsbuild-dev-middleware',
      externals: {
        rslog: '../rslog',
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
      copyDts: true,
      externals: {
        picocolors: '../picocolors',
      },
      afterBundle(task) {
        // source-map-js type does not exist, use a stub instead
        replaceFileContent(join(task.distPath, 'lib/postcss.d.ts'), (content) =>
          content.replace("from 'source-map-js'", 'from "./source-map-js"'),
        );
        replaceFileContent(
          join(task.distPath, 'lib/previous-map.d.ts'),
          (content) =>
            content.replace("from 'source-map-js'", 'from "./source-map-js"'),
        );
        fs.writeFileSync(
          join(task.distPath, 'lib/source-map-js.d.ts'),
          `
export type RawSourceMap = unknown;
export type SourceMapConsumer = unknown;
export type SourceMapGenerator = unknown;
`,
        );
      },
    },
    {
      name: 'css-loader',
      ignoreDts: true,
      externals: {
        postcss: '../postcss',
      },
    },
    {
      name: 'postcss-loader',
      externals: {
        jiti: 'jiti',
        postcss: '../postcss',
      },
      ignoreDts: true,
    },
    {
      name: '@jridgewell/remapping',
      ignoreDts: true,
    },
  ],
};
