import type { RsbuildPlugin } from '../types';

export function pluginExternals(): RsbuildPlugin {
  return {
    name: 'plugin-externals',
    setup(api) {
      api.modifyBundlerChain((chain) => {
        const { externals } = api.getNormalizedConfig().output;
        if (externals) {
          chain.externals(externals);
        }
      });

      api.onBeforeCreateCompiler(({ bundlerConfigs }) => {
        bundlerConfigs.forEach((config) => {
          const isWebWorker = Array.isArray(config.target)
            ? config.target.includes('webworker')
            : config.target === 'webworker';

          // externals will not take effect, the Worker environment can not access global variables.
          if (isWebWorker && config.externals) {
            delete config.externals;
          }
        });
      });
    },
  };
}
