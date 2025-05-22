import { color, getPublicPathFromChain } from '../helpers';
import { logger } from '../logger';
import type { Define, RsbuildPlugin } from '../types';

function checkProcessEnvSecurity(define: Define) {
  const value = define['process.env'];

  if (!value) {
    return;
  }

  const check = (value: Record<string, unknown>) => {
    const pathKey = Object.keys(value).find(
      // Windows uses `Path`, other platforms use `PATH`
      (key) => key.toLowerCase() === 'path' && value[key] === process.env[key],
    );

    if (!pathKey) {
      return;
    }

    logger.warn(
      `${color.dim('[rsbuild:config]')} The ${color.yellow(
        '"source.define"',
      )} option includes an object with the key ${color.yellow(
        JSON.stringify(pathKey),
      )} under ${color.yellow('"process.env"')}, indicating potential exposure of all environment variables. This can lead to security risks and should be avoided.`,
    );
  };

  // Check `{ 'process.env': process.env }`
  if (typeof value === 'object') {
    check(value);
    return;
  }

  // Check `{ 'process.env': JSON.stringify(process.env) }`
  if (typeof value === 'string') {
    try {
      check(JSON.parse(value));
    } catch (error) {}
  }
}

export const pluginDefine = (): RsbuildPlugin => ({
  name: 'rsbuild:define',

  setup(api) {
    api.modifyBundlerChain((chain, { CHAIN_ID, bundler, environment }) => {
      const { config } = environment;

      const baseUrl = JSON.stringify(config.server.base);
      const assetPrefix = JSON.stringify(getPublicPathFromChain(chain, false));

      const builtinVars: Define = {
        'import.meta.env.MODE': JSON.stringify(config.mode),
        'import.meta.env.DEV': config.mode === 'development',
        'import.meta.env.PROD': config.mode === 'production',
        'import.meta.env.BASE_URL': baseUrl,
        'import.meta.env.ASSET_PREFIX': assetPrefix,
        'process.env.BASE_URL': baseUrl,
        'process.env.ASSET_PREFIX': assetPrefix,
      };

      const mergedDefine = { ...builtinVars, ...config.source.define };

      checkProcessEnvSecurity(mergedDefine);

      chain
        .plugin(CHAIN_ID.PLUGIN.DEFINE)
        .use(bundler.DefinePlugin, [mergedDefine]);
    });
  },
});
