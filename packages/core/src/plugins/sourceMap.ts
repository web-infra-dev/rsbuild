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

export const pluginSourceMap = (): RsbuildPlugin => ({
  name: 'rsbuild:source-map',

  setup(api) {
    const sourceMapFilenameTemplate = ({
      absoluteResourcePath,
    }: {
      absoluteResourcePath: string;
    }) => absoluteResourcePath;

    api.modifyBundlerChain((chain, { bundler, environment }) => {
      const { config } = environment;
      const devtool = getDevtool(config);

      chain
        .devtool(devtool)
        .output.devtoolModuleFilenameTemplate(sourceMapFilenameTemplate);

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
    });

    // Use project-relative POSIX paths in source maps:
    // - Prevents leaking absolute system paths
    // - Keeps maps portable across environments
    // - Matches source map spec and debugger expectations
    api.processAssets(
      // Source maps has been extracted to separate files on this stage
      { stage: 'optimize-transfer' },
      ({ assets, compilation, sources }) => {
        // If devtoolModuleFilenameTemplate is not the default template,
        // which means users want to customize it, skip the default processing.
        if (
          compilation.outputOptions.devtoolModuleFilenameTemplate !==
          sourceMapFilenameTemplate
        ) {
          return;
        }

        const { distPath } = api.context;

        for (const [filename, asset] of Object.entries(assets)) {
          if (!filename.endsWith('.map')) {
            continue;
          }

          const rawSource = asset.source();
          let map: Rspack.RawSourceMap;
          try {
            map = JSON.parse(
              Buffer.isBuffer(rawSource) ? rawSource.toString() : rawSource,
            );
          } catch {
            continue;
          }

          if (!Array.isArray(map.sources)) {
            continue;
          }

          const mapDir = path.dirname(path.join(distPath, filename));

          let isSourcesUpdated = false;

          map.sources = map.sources.map((source) => {
            if (path.isAbsolute(source)) {
              isSourcesUpdated = true;
              return toPosixPath(path.relative(mapDir, source));
            }
            return source;
          });

          if (!isSourcesUpdated) {
            continue;
          }

          compilation.updateAsset(
            filename,
            new sources.RawSource(JSON.stringify(map)),
          );
        }
      },
    );
  },
});
