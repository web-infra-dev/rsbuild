import { createRequire } from 'node:module';

/**
 * Currently, Rspack only provides a CJS bundle, so we use require to load it
 * for better startup performance. If we use `import { rspack } from '@rspack/core'`,
 * Node.js will use `cjs-module-lexer` to parse it, which slows down startup by ~30ms.
 * We can remove this module once `@rspack/core` provides an ESM bundle in the future.
 */
const require = createRequire(import.meta.url);
const rspack: (typeof import('@rspack/core'))['rspack'] =
  require('@rspack/core') as (typeof import('@rspack/core'))['rspack'];

export { rspack };
