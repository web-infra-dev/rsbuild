import type { RsbuildPlugin } from '../types';

/**
 * Set some basic Rspack configs
 */
export const pluginBasic = (): RsbuildPlugin => ({
  name: 'rsbuild:basic',

  setup(api) {
    api.modifyBundlerChain(
      (chain, { isDev, isProd, target, bundler, environment, CHAIN_ID }) => {
        const { config } = environment;

        chain.name(environment.name);

        // The base directory for resolving entry points and loaders from the configuration.
        chain.context(api.context.rootPath);

        chain.mode(environment.config.mode);

        chain.infrastructureLogging({
          // Using `error` level to avoid `cache.PackFileCacheStrategy` logs
          level: 'error',
        });

        chain.watchOptions({
          // Remove the delay before rebuilding once the first file changed
          aggregateTimeout: 0,
        });

        // Disable performance hints, these logs are too complex
        chain.performance.hints(false);

        // Align with the futureDefaults of webpack 6
        chain.module.parser.merge({
          javascript: {
            exportsPresence: 'error',
          },
        });

        const usingHMR = isDev && config.dev.hmr && target === 'web';

        if (usingHMR) {
          chain
            .plugin(CHAIN_ID.PLUGIN.HMR)
            .use(bundler.HotModuleReplacementPlugin);
        }

        if (api.context.bundlerType === 'rspack') {
          chain.module.parser.merge({
            javascript: {
              inlineConst: isProd,
              typeReexportsPresence: 'tolerant',
            },
          });

          chain.experiments({
            ...chain.get('experiments'),
            inlineEnum: isProd,
            inlineConst: isProd,
            typeReexportsPresence: true,
            rspackFuture: {
              bundlerInfo: {
                force: false,
              },
            },
          });
        }
      },
    );
  },
});
