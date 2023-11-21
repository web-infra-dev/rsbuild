import { SharedRsbuildPluginAPI } from '../types';
import { TARGET_ID_MAP } from '../constants';

export function applyBasicPlugin(api: SharedRsbuildPluginAPI) {
  api.modifyBundlerChain((chain, { isProd, target }) => {
    chain.name(TARGET_ID_MAP[target]);
    // The base directory for resolving entry points and loaders from the configuration.
    chain.context(api.context.rootPath);

    chain.mode(isProd ? 'production' : 'development');

    chain.merge({
      infrastructureLogging: {
        // Using `error` level to avoid `cache.PackFileCacheStrategy` logs
        level: 'error',
      },
    });

    if (!isProd) {
      chain.watchOptions({
        // The default aggregateTimeout of WatchPack is 200ms,
        // using smaller values can improve hmr performance
        aggregateTimeout: 5,
      });
    }
  });
}
