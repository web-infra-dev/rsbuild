import type { ConfigChain, RsbuildConfig, RsbuildPlugin } from '@rsbuild/core';
import { getNodeEnv, isServerTarget, reduceConfigs } from '@rsbuild/shared';

/**
 * the options of [rspackExperiments.styledComponents](https://rspack.dev/guide/features/builtin-swc-loader#rspackexperimentsstyledcomponents).
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

export const pluginStyledComponents = (
  pluginOptions: ConfigChain<PluginStyledComponentsOptions> = {},
): RsbuildPlugin => ({
  name: 'rsbuild:styled-components',

  setup(api) {
    if (api.context.bundlerType === 'webpack') {
      return;
    }

    const getMergedOptions = () => {
      const useSSR = isServerTarget(api.context.targets);
      const isProd = getNodeEnv() === 'production';

      return reduceConfigs({
        initial: getDefaultStyledComponentsConfig(isProd, useSSR),
        config: pluginOptions,
      });
    };

    api.modifyRsbuildConfig((userConfig, { mergeRsbuildConfig }) => {
      const extraConfig: RsbuildConfig = {
        tools: {
          swc(opts) {
            const mergedOptions = getMergedOptions();
            if (!mergedOptions) {
              return opts;
            }

            opts.rspackExperiments ??= {};
            opts.rspackExperiments.styledComponents = mergedOptions;
            return opts;
          },
        },
      };

      return mergeRsbuildConfig(extraConfig, userConfig);
    });
  },
});
