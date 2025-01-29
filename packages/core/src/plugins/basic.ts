import path from 'node:path';
import { toPosixPath } from '../helpers/path';
import type {
  NormalizedEnvironmentConfig,
  RsbuildPlugin,
  Rspack,
} from '../types';

const getDevtool = (config: NormalizedEnvironmentConfig): Rspack.DevTool => {
  const { sourceMap } = config.output;
  const isProd = config.mode === 'production';

  if (sourceMap === false) {
    return false;
  }
  if (sourceMap === true) {
    return isProd ? 'source-map' : 'cheap-module-source-map';
  }
  if (sourceMap.js === undefined) {
    return isProd ? false : 'cheap-module-source-map';
  }
  return sourceMap.js;
};

/**
 * Set some basic Rspack configs
 */
export const pluginBasic = (): RsbuildPlugin => ({
  name: 'rsbuild:basic',

  setup(api) {
    api.modifyBundlerChain(
      (chain, { env, isDev, target, bundler, environment, CHAIN_ID }) => {
        const { config } = environment;

        chain.name(environment.name);

        const devtool = getDevtool(config);
        chain.devtool(devtool);

        // When JS source map is disabled, but CSS source map is enabled,
        // add `SourceMapDevToolPlugin` to let Rspack generate CSS source map.
        const { sourceMap } = config.output;
        if (!devtool && typeof sourceMap === 'object' && sourceMap.css) {
          chain.plugin('source-map-css').use(bundler.SourceMapDevToolPlugin, [
            {
              test: /\.css$/,
              filename: '[file].map[query]',
            },
          ]);
        }

        // The base directory for resolving entry points and loaders from the configuration.
        chain.context(api.context.rootPath);

        chain.mode(environment.config.mode);

        chain.merge({
          infrastructureLogging: {
            // Using `error` level to avoid `cache.PackFileCacheStrategy` logs
            level: 'error',
          },
        });

        chain.watchOptions({
          // Ignore watching files in node_modules to reduce memory usage and make startup faster
          ignored: /[\\/](?:\.git|node_modules)[\\/]/,
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

        if (env === 'development') {
          // Set correct path for source map
          // this helps VS Code break points working correctly in monorepo
          chain.output.devtoolModuleFilenameTemplate(
            (info: { absoluteResourcePath: string }) =>
              toPosixPath(path.resolve(info.absoluteResourcePath)),
          );
        }

        // enable Rspack config schema validation, unrecognized keys are allowed
        process.env.RSPACK_CONFIG_VALIDATE ||= 'loose-unrecognized-keys';

        // improve kill process performance
        // https://github.com/web-infra-dev/rspack/pull/5486
        process.env.WATCHPACK_WATCHER_LIMIT ||= '20';

        // This is temporary, we will remove it after Rspack incremental is stable
        if (process.env.EXPERIMENTAL_RSPACK_INCREMENTAL) {
          chain.experiments({
            ...chain.get('experiments'),
            incremental: isDev,
          });
        }
      },
    );
  },
});
