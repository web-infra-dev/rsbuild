import { JS_REGEX } from '../constants';
import { normalizeRuleConditionPath, toPosixPath } from '../helpers/path';
import type {
  NormalizedEnvironmentConfig,
  RsbuildPlugin,
  Rspack,
  RspackChain,
  SourceMapExtractTarget,
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

    const DEFAULT_FALLBACK_SOURCE_MAP_TEMPLATE =
      '[relative-resource-path]?[hash]';

    const enableCssSourceMap = (config: NormalizedEnvironmentConfig) => {
      const { sourceMap } = config.output;
      return typeof sourceMap === 'object' && sourceMap.css;
    };

    const normalizeExtractTarget = (
      target: boolean | SourceMapExtractTarget | undefined,
    ): false | SourceMapExtractTarget => {
      if (!target) return false;
      if (target === true) return {};

      return {
        include: target.include?.map(normalizeRuleConditionPath),
        exclude: target.exclude?.map(normalizeRuleConditionPath),
      };
    };

    const getExtractConfig = (config: NormalizedEnvironmentConfig) => {
      const { sourceMap } = config.output;

      if (typeof sourceMap !== 'object' || !sourceMap.extract) return false;
      if (sourceMap.extract === true) return { js: {} };

      const js = normalizeExtractTarget(sourceMap.extract.js);
      if (!js) return false;

      return { js } as const;
    };

    const applyExtractRule = (
      chain: RspackChain,
      name: string,
      test: RegExp,
      target: false | SourceMapExtractTarget,
    ) => {
      if (!target) return;

      const rule = chain.module
        .rule(name)
        .test(test)
        .set('extractSourceMap', true);

      const { include, exclude } = target;

      if (include) {
        for (const condition of include) {
          rule.include.add(condition);
        }
      }

      if (exclude) {
        for (const condition of exclude) {
          rule.exclude.add(condition);
        }
      }
    };

    api.modifyBundlerChain({
      order: 'pre',
      handler: (chain, { environment }) => {
        const extractConfig = getExtractConfig(environment.config);
        if (!extractConfig) return;

        applyExtractRule(
          chain,
          'source-map-extract-js',
          JS_REGEX,
          extractConfig.js,
        );
      },
    });

    api.modifyBundlerChain((chain, { rspack, environment, isDev, target }) => {
      const { config } = environment;

      const devtool = getDevtool(config);
      chain.devtool(devtool);

      if (isDev && target === 'web') {
        // Use POSIX-style absolute paths in source maps during development
        // This ensures VS Code and browser debuggers can correctly resolve breakpoints
        chain.output.devtoolModuleFilenameTemplate(
          (info: { absoluteResourcePath: string }) =>
            toPosixPath(info.absoluteResourcePath),
        );
        chain.output.devtoolFallbackModuleFilenameTemplate(
          (info: { absoluteResourcePath: string; hash: string }) =>
            `${toPosixPath(info.absoluteResourcePath)}?${info.hash}`,
        );
      } else {
        chain.output.devtoolModuleFilenameTemplate(DEFAULT_SOURCE_MAP_TEMPLATE);
        chain.output.devtoolFallbackModuleFilenameTemplate(
          DEFAULT_FALLBACK_SOURCE_MAP_TEMPLATE,
        );
      }

      // When JS source map is disabled, but CSS source map is enabled,
      // add `SourceMapDevToolPlugin` to let Rspack generate CSS source map.
      if (!devtool && enableCssSourceMap(config)) {
        chain.plugin('source-map-css').use(rspack.SourceMapDevToolPlugin, [
          {
            test: /\.css$/,
            filename: '[file].map[query]',
          },
        ]);
      }
    });
  },
});
