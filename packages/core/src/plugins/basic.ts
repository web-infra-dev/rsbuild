import path from 'node:path';
import { isProd } from '../helpers';
import type { NormalizedEnvironmentConfig, RsbuildPlugin } from '../types';

const getJsSourceMap = (config: NormalizedEnvironmentConfig) => {
  const { sourceMap } = config.output;
  if (sourceMap.js === undefined) {
    return isProd() ? false : 'cheap-module-source-map';
  }
  return sourceMap.js;
};

/**
 * Provide some basic configs of rspack
 */
export const pluginBasic = (): RsbuildPlugin => ({
  name: 'rsbuild:basic',

  setup(api) {
    api.modifyBundlerChain(
      (chain, { env, isProd, target, bundler, environment, CHAIN_ID }) => {
        const { config } = environment;

        chain.name(environment.name);

        chain.devtool(getJsSourceMap(config));

        // The base directory for resolving entry points and loaders from the configuration.
        chain.context(api.context.rootPath);

        chain.mode(isProd ? 'production' : 'development');

        chain.merge({
          infrastructureLogging: {
            // Using `error` level to avoid `cache.PackFileCacheStrategy` logs
            level: 'error',
          },
        });

        // Disable performance hints, these logs are too complex
        chain.performance.hints(false);

        // Align with the futureDefaults of webpack 6
        chain.module.parser.merge({
          javascript: {
            exportsPresence: 'error',
          },
        });

        const usingHMR = !isProd && config.dev.hmr && target === 'web';

        if (usingHMR) {
          chain
            .plugin(CHAIN_ID.PLUGIN.HMR)
            .use(bundler.HotModuleReplacementPlugin);
        }

        if (env === 'development') {
          // Set correct path for source map
          // this helps VS Code break points working correctly in monorepo
          chain.output.devtoolModuleFilenameTemplate(
            (info: { absoluteResourcePath: string }) =>
              path.resolve(info.absoluteResourcePath).replace(/\\/g, '/'),
          );
        }

        process.env.RSPACK_CONFIG_VALIDATE = 'loose-silent';

        // improve kill process performance
        // https://github.com/web-infra-dev/rspack/pull/5486
        process.env.WATCHPACK_WATCHER_LIMIT ||= '20';
      },
    );
  },
});
