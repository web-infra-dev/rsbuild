import type {
  MergedEnvironmentConfig,
  RsbuildConfig,
  RsbuildPlugin,
  RsbuildTarget,
} from '@rsbuild/core';
import { type ConfigChain, reduceConfigs } from 'reduce-configs';

/**
 * The options of [@swc/plugin-styled-components](https://www.npmjs.com/package/@swc/plugin-styled-components).
 */
export type PluginStyledComponentsOptions = {
  displayName?: boolean;
  ssr?: boolean;
  fileName?: boolean;
  meaninglessFileNames?: string[];
  namespace?: string;
  topLevelImportPaths?: string[];
  transpileTemplateLiterals?: boolean;
  minify?: boolean;
  pure?: boolean;
  cssProps?: boolean;
};

function isServerTarget(target: RsbuildTarget[]) {
  return Array.isArray(target) ? target.includes('node') : target === 'node';
}

const getDefaultStyledComponentsConfig = (isProd: boolean, ssr: boolean) => {
  return {
    ssr,
    // "pure" is used to improve dead code elimination in production.
    // we don't need to enable it in development because it will slow down the build process.
    pure: isProd,
    displayName: true,
    transpileTemplateLiterals: true,
  };
};

export const PLUGIN_STYLED_COMPONENTS_NAME = 'rsbuild:styled-components';

export const pluginStyledComponents = (
  pluginOptions: ConfigChain<PluginStyledComponentsOptions> = {},
): RsbuildPlugin => ({
  name: PLUGIN_STYLED_COMPONENTS_NAME,

  setup(api) {
    if (api.context.bundlerType === 'webpack') {
      return;
    }

    const getMergedOptions = (
      useSSR: boolean,
      config: MergedEnvironmentConfig,
    ) => {
      const isProd = config.mode === 'production';

      return reduceConfigs({
        initial: getDefaultStyledComponentsConfig(isProd, useSSR),
        config: pluginOptions,
      });
    };

    api.modifyEnvironmentConfig((userConfig, { mergeEnvironmentConfig }) => {
      const rsbuildConfig = api.getRsbuildConfig();

      const targets = rsbuildConfig.environments
        ? Object.values(rsbuildConfig.environments).map(
            (e) => e.output?.target || userConfig.output?.target || 'web',
          )
        : [userConfig.output?.target || 'web'];

      const useSSR = isServerTarget(targets);

      const mergedOptions = getMergedOptions(useSSR, userConfig);
      if (!mergedOptions) {
        return userConfig;
      }

      const extraConfig: RsbuildConfig = {
        tools: {
          swc: {
            jsc: {
              experimental: {
                plugins: [
                  [
                    require.resolve('@swc/plugin-styled-components'),
                    mergedOptions,
                  ],
                ],
              },
            },
          },
        },
      };

      return mergeEnvironmentConfig(extraConfig, userConfig);
    });
  },
});
