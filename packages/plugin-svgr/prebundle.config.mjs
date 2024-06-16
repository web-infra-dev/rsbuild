// @ts-check
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// The package size of `schema-utils` is large, and validate has a performance overhead of tens of ms.
// So we skip the validation and let TypeScript to ensure type safety.
const writeEmptySchemaUtils = (task) => {
  const schemaUtilsPath = join(task.distPath, 'schema-utils.js');
  writeFileSync(schemaUtilsPath, 'module.exports.validate = () => {};');
};

/** @type {import('prebundle').Config} */
export default {
  dependencies: [
    {
      name: 'file-loader',
      ignoreDts: true,
      externals: {
        'schema-utils': './schema-utils',
        'loader-utils': 'loader-utils',
      },
      afterBundle: writeEmptySchemaUtils,
    },
    {
      name: 'url-loader',
      ignoreDts: true,
      externals: {
        'schema-utils': './schema-utils',
        'loader-utils': 'loader-utils',
      },
      afterBundle(task) {
        writeEmptySchemaUtils(task);

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
};
