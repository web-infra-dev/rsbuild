import type { RsbuildPlugin } from '@rsbuild/core';
import {
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
  userConfig: ChainedConfig<PluginStyledComponentsOptions> = {},
): RsbuildPlugin => ({
  name: 'rsbuild:styled-components',

  setup(api) {
    api.modifyBundlerChain(async (chain, { CHAIN_ID, isProd }) => {
      const { bundlerType } = api.context;

      if (bundlerType === 'webpack') {
        return;
      }

      const isSSR = isServerTarget(api.context.target);

      const styledComponentsOptions = mergeChainedOptions({
        defaults: getDefaultStyledComponentsConfig(isProd, isSSR),
        options: userConfig,
      });

      if (!styledComponentsOptions) {
        return;
      }

      [CHAIN_ID.RULE.JS, CHAIN_ID.RULE.JS_DATA_URI].forEach((ruleId) => {
        if (chain.module.rules.has(ruleId)) {
          const rule = chain.module.rule(ruleId);
          if (rule.uses.has(CHAIN_ID.USE.SWC)) {
            // update rspack builtin:swc-loader configuration
            rule.use(CHAIN_ID.USE.SWC).tap((options) => {
              options.rspackExperiments ??= {};
              options.rspackExperiments.styledComponents =
                styledComponentsOptions;
              return options;
            });
          }
        }
      });
    });
  },
});
