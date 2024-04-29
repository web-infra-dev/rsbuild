import fs from 'node:fs';
// @ts-check
import { join } from 'node:path';

// The package size of `schema-utils` is large, and validate has a performance overhead of tens of ms.
// So we skip the validation and let TypeScript to ensure type safety.
const writeEmptySchemaUtils = (task) => {
  const schemaUtilsPath = join(task.distPath, 'schema-utils.js');
  fs.writeFileSync(schemaUtilsPath, 'module.exports.validate = () => {};');
};

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
      name: 'webpack-dev-middleware',
      externals: {
        'schema-utils': './schema-utils',
        'schema-utils/declarations/validate':
          'schema-utils/declarations/validate',
        'mime-types': '@rsbuild/shared/mime-types',
      },
      ignoreDts: true,
      afterBundle: writeEmptySchemaUtils,
    },
  ],
};
