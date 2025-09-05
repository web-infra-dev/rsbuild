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
      (chain, { isDev, isProd, target, bundler, environment, CHAIN_ID }) => {
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
            inlineConst: isProd,
            exportsPresence: 'error',
            typeReexportsPresence: 'tolerant',
          },
        });

        const usingHMR = isDev && config.dev.hmr && target === 'web';

        if (usingHMR) {
          chain
            .plugin(CHAIN_ID.PLUGIN.HMR)
            .use(bundler.HotModuleReplacementPlugin);
        }

        if (isDev) {
          // Set correct path for source map
          // this helps VS Code break points working correctly in monorepo
          chain.output.devtoolModuleFilenameTemplate(
            (info: { absoluteResourcePath: string }) =>
              toPosixPath(info.absoluteResourcePath),
          );
        }

        if (api.context.bundlerType === 'rspack') {
          chain.experiments({
            ...chain.get('experiments'),
            lazyBarrel: true,
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

        // Disable Rspack's config schema validation to improve performance.
        // Rsbuild has ensured that the built-in Rspack configuration is correct
        // through TypeScript, so we no longer need to perform schema validation
        // at runtime. This can be manually enabled via `RSPACK_CONFIG_VALIDATE=strict'
        process.env.RSPACK_CONFIG_VALIDATE ||= 'loose-silent';
      },
    );
  },
});
