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
  dependencies: [
    {
      name: 'sass-loader',
      externals: {
        sass: 'sass',
        webpack: 'webpack',
      },
      // fix Options type
      afterBundle: (task) => {
        replaceFileContent(
          join(task.distPath, 'index.d.ts'),
          (content) =>
            `${content.replace(
              /export { loader as default };/,
              'export { loader as default, LoaderOptions };',
            )}`,
        );
      },
    },
    {
      name: 'resolve-url-loader',
      ignoreDts: true,
      externals: {
        postcss: 'postcss',
        'loader-utils': 'loader-utils',
      },
    },
  ],
};
