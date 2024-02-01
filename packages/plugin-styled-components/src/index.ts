import type { RsbuildPlugin } from '@rsbuild/core';
import {
  isServerTarget,
  mergeChainedOptions,
  modifySwcLoaderOptions,
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
  userConfig: ChainedConfig<PluginStyledComponentsOptions> = {},
): RsbuildPlugin => ({
  name: 'rsbuild:styled-components',

  setup(api) {
    api.modifyBundlerChain(async (chain, { isProd }) => {
      const { bundlerType } = api.context;

      if (bundlerType === 'webpack') {
        return;
      }

      const isSSR = isServerTarget(api.context.targets);

      const styledComponentsOptions = mergeChainedOptions({
        defaults: getDefaultStyledComponentsConfig(isProd, isSSR),
        options: userConfig,
      });

      if (!styledComponentsOptions) {
        return;
      }

      modifySwcLoaderOptions({
        chain,
        modifier: (options) => {
          options.rspackExperiments ??= {};
          options.rspackExperiments.styledComponents = styledComponentsOptions;
          return options;
        },
      });
    });
  },
});
