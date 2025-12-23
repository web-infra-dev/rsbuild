import { createRequire } from 'node:module';
import { COMPILED_PATH } from '../constants';

const require = createRequire(import.meta.url);

type CompiledPackages = {
  ws: typeof import('../../compiled/ws').default;
  cors: typeof import('../../compiled/cors').default;
  sirv: typeof import('../../compiled/sirv');
  memfs: typeof import('../../compiled/memfs');
  mrmime: typeof import('../../compiled/mrmime');
  connect: typeof import('../../compiled/connect').default;
  chokidar: typeof import('../../compiled/chokidar').default;
  tinyglobby: typeof import('../../compiled/tinyglobby');
  picocolors: typeof import('../../compiled/picocolors').default;
  'webpack-merge': typeof import('../../compiled/webpack-merge');
  'html-rspack-plugin': typeof import('../../compiled/html-rspack-plugin').default;
  'http-proxy-middleware': typeof import('../../compiled/http-proxy-middleware');
  'webpack-bundle-analyzer': typeof import('../../compiled/webpack-bundle-analyzer');
  'rspack-manifest-plugin': typeof import('../../compiled/rspack-manifest-plugin');
  'launch-editor-middleware': typeof import('../../compiled/launch-editor-middleware');
  '@jridgewell/remapping': typeof import('../../compiled/@jridgewell/remapping');
  '@jridgewell/trace-mapping': typeof import('../../compiled/@jridgewell/trace-mapping');
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
