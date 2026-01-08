import { createRequire } from 'node:module';
import { COMPILED_PATH } from '../constants';

const require = createRequire(import.meta.url);

type CompiledPackages = {
  ws: typeof import('../../compiled/ws').default;
  sirv: typeof import('../../compiled/sirv');
  mrmime: typeof import('../../compiled/mrmime');
  chokidar: typeof import('../../compiled/chokidar').default;
  picocolors: typeof import('../../compiled/picocolors').default;
  'webpack-merge': typeof import('../../compiled/webpack-merge');
  'html-rspack-plugin': typeof import('../../compiled/html-rspack-plugin').default;
  'http-proxy-middleware': typeof import('../../compiled/http-proxy-middleware');
  'launch-editor-middleware': typeof import('../../compiled/launch-editor-middleware');
};

/**
 * Load compiled package from `compiled` folder.
 * use `require()` as compiled packages are CommonJS modules.
 * https://github.com/nodejs/node/issues/59913
 * @param name
 * @returns
 */
export const requireCompiledPackage = <T extends keyof CompiledPackages>(
  name: T,
): CompiledPackages[T] => require(`${COMPILED_PATH}/${name}/index.js`);

export const color: typeof import('../../compiled/picocolors').default =
  requireCompiledPackage('picocolors');
