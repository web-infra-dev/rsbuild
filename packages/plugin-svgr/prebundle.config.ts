import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Config } from 'prebundle';

export default {
  prettier: true,
  dependencies: [
    {
      name: 'file-loader',
      ignoreDts: true,
      externals: {
        'loader-utils': 'loader-utils',
      },
    },
    {
      name: 'url-loader',
      ignoreDts: true,
      externals: {
        'loader-utils': 'loader-utils',
      },
      afterBundle(task) {
        const filePath = join(task.distPath, 'index.js');
        const content = readFileSync(filePath, 'utf-8');
        const newContent = content.replace(
          /['"]file-loader['"]/,
          'require.resolve("../file-loader")',
        );
        if (newContent !== content) {
          writeFileSync(filePath, newContent);
        }
      },
    },
  ],
} satisfies Config;
