// @ts-check
import { writeFileSync } from 'node:fs';
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
      name: 'babel-loader',
      ignoreDts: true,
      externals: {
        '@babel/core': '@babel/core',
        'schema-utils': './schema-utils',
      },
      afterBundle: writeEmptySchemaUtils,
    },
  ],
};
