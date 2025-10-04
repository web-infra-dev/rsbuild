import { createRequire } from 'node:module';

/**
 * Currently, Rspack only provides a CJS bundle, so we use require to load it
 * for better startup performance.
 * https://github.com/nodejs/node/issues/59913
 */
const require = createRequire(import.meta.url);
const rspack: (typeof import('@rspack/core'))['rspack'] = require('@rspack/core');

export { rspack };
