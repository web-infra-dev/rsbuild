import type { RsbuildConfig, RsbuildPlugin } from '@rsbuild/core';
import {
  getNodeEnv,
  isServerTarget,
  mergeChainedOptions,
  getDefaultStyledComponentsConfig,
  type ChainedConfig,
} from '@rsbuild/shared';

/**
 * the options of [babel-plugin-styled-components](https://github.com/styled-components/babel-plugin-styled-components) or [rspackExperiments.styledComponents](https://rspack.dev/guide/loader#optionsrspackexperimentsstyledcomponents).
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

export const pluginStyledComponents = (
  pluginOptions: ChainedConfig<PluginStyledComponentsOptions> = {},
): RsbuildPlugin => ({
  name: 'rsbuild:styled-components',

  setup(api) {
    if (api.context.bundlerType === 'webpack') {
      return;
    }

    const getMergedOptions = () => {
      const useSSR = isServerTarget(api.context.targets);
      const isProd = getNodeEnv() === 'production';

      return mergeChainedOptions({
        defaults: getDefaultStyledComponentsConfig(isProd, useSSR),
        options: pluginOptions,
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
