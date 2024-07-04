import type {
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

    const getMergedOptions = (useSSR: boolean) => {
      const isProd = process.env.NODE_ENV === 'production';

      return reduceConfigs({
        initial: getDefaultStyledComponentsConfig(isProd, useSSR),
        config: pluginOptions,
      });
    };

    api.modifyRsbuildConfig({
      order: 'post',
      handler: (userConfig, { mergeRsbuildConfig }) => {
        const targets = userConfig.environments
          ? Object.values(userConfig.environments).map(
              (e) => e.output?.target || userConfig.output?.target || 'web',
            )
          : [userConfig.output?.target || 'web'];
        const useSSR = isServerTarget(targets);
        const mergedOptions = getMergedOptions(useSSR);
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

        return mergeRsbuildConfig(extraConfig, userConfig);
      },
    });
  },
});
