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
  prettier: true,
  dependencies: [
    // prebundle less to make correct the types
    {
      name: 'less',
      externals: {
        // needle is an optional dependency and no need to bundle it.
        needle: 'needle',
      },
    },
    // prebundle less-loader to make it works in Node 16
    {
      name: 'less-loader',
      ignoreDts: true,
      externals: {
        less: 'less',
      },
    },
  ],
};
