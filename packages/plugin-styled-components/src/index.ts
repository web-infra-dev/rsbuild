import type {
  ConfigChain,
  RsbuildConfig,
  RsbuildPlugin,
  RsbuildTarget,
} from '@rsbuild/core';
import { reduceConfigs } from '@rsbuild/core';

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

function isServerTarget(target: RsbuildTarget[]) {
  return (Array.isArray(target) ? target : [target]).some((item) =>
    ['node', 'service-worker'].includes(item),
  );
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

    const getMergedOptions = () => {
      const useSSR = isServerTarget(api.context.targets);
      const isProd = process.env.NODE_ENV === 'production';

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
