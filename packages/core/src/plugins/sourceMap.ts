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

export const pluginSourceMap = (): RsbuildPlugin => ({
  name: 'rsbuild:source-map',

  setup(api) {
    // Use project-relative POSIX paths in source maps:
    // - Prevents leaking absolute system paths
    // - Keeps maps portable across environments
    // - Matches source map spec and debugger expectations
    const DEFAULT_SOURCE_MAP_TEMPLATE = '[relative-resource-path]';

    const enableCssSourceMap = (config: NormalizedEnvironmentConfig) => {
      const { sourceMap } = config.output;
      return typeof sourceMap === 'object' && sourceMap.css;
    };

    api.modifyBundlerChain((chain, { bundler, environment, isDev, target }) => {
      const { config } = environment;

      const devtool = getDevtool(config);
      chain.devtool(devtool);

      if (
        (isDev && target === 'web') ||
        // webpack does not support [relative-resource-path]
        api.context.bundlerType === 'webpack'
      ) {
        // Use POSIX-style absolute paths in source maps during development
        // This ensures VS Code and browser debuggers can correctly resolve breakpoints
        chain.output.devtoolModuleFilenameTemplate(
          (info: { absoluteResourcePath: string }) =>
            toPosixPath(info.absoluteResourcePath),
        );
      } else {
        chain.output.devtoolModuleFilenameTemplate(DEFAULT_SOURCE_MAP_TEMPLATE);
      }

      // When JS source map is disabled, but CSS source map is enabled,
      // add `SourceMapDevToolPlugin` to let Rspack generate CSS source map.
      if (!devtool && enableCssSourceMap(config)) {
        chain.plugin('source-map-css').use(bundler.SourceMapDevToolPlugin, [
          {
            test: /\.css$/,
            filename: '[file].map[query]',
          },
        ]);
      }
    });
  },
});
