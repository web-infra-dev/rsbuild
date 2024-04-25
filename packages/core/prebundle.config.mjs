// @ts-check
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/** @type {import('prebundle').Config} */
export default {
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
        const filePath = join(task.distPath, 'sirv.d.ts');
        const content = readFileSync(filePath, 'utf-8');
        const newContent = `${content.replace(
          "declare module 'sirv'",
          'declare namespace sirv',
        )}\nexport = sirv;`;

        if (newContent !== content) {
          writeFileSync(filePath, newContent);
        }
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
};
