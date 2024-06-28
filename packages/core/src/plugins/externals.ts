import type { RsbuildPlugin } from '../types';

export function pluginExternals(): RsbuildPlugin {
  return {
    name: 'rsbuild:externals',
    setup(api) {
      api.modifyBundlerChain((chain, { environment }) => {
        const { externals } = environment.config.output;
        if (externals) {
          chain.externals(externals);
        }
      });

      api.onBeforeCreateCompiler(({ bundlerConfigs }) => {
        for (const config of bundlerConfigs) {
          const isWebWorker = Array.isArray(config.target)
            ? config.target.includes('webworker')
            : config.target === 'webworker';

          // externals will not take effect, the Worker environment can not access global variables.
          if (isWebWorker && config.externals) {
            delete config.externals;
          }
        }
      });
    },
  };
}
