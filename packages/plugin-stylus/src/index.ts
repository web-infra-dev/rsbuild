import type { RsbuildPlugin } from '@rsbuild/core';
import {
  STYLUS_REGEX,
  isUseCssSourceMap,
  mergeChainedOptions,
} from '@rsbuild/shared';
import { deepmerge } from '@rsbuild/shared/deepmerge';
import type { RsbuildPluginAPI } from '@rsbuild/webpack';

type StylusOptions = {
  use?: string[];
  include?: string;
  import?: string;
  resolveURL?: boolean;
  lineNumbers?: boolean;
  hoistAtrules?: boolean;
};

type StylusLoaderOptions = {
  stylusOptions?: StylusOptions;
  sourceMap?: boolean;
};

export type PluginStylusOptions = StylusLoaderOptions;

export function pluginStylus(
  options?: PluginStylusOptions,
): RsbuildPlugin<RsbuildPluginAPI> {
  return {
    name: 'plugin-stylus',

    async setup(api) {
      const { bundlerType } = api.context;
      api.modifyBundlerChain(async (chain, utils) => {
        const config = api.getNormalizedConfig();

        const mergedOptions = mergeChainedOptions({
          defaults: {
            sourceMap: isUseCssSourceMap(config),
          },
          options,
          mergeFn: deepmerge,
        });

        const rule = chain.module
          .rule(utils.CHAIN_ID.RULE.STYLUS)
          .test(STYLUS_REGEX);

        const { applyBaseCSSRule } = await import(
          bundlerType === 'webpack'
            ? '@rsbuild/webpack/plugin-css'
            : '@rsbuild/core/rspack-plugin-css'
        );
        await applyBaseCSSRule({
          rule,
          config: config as any,
          context: api.context,
          utils,
          importLoaders: 2,
        });

        rule
          .use(utils.CHAIN_ID.USE.STYLUS)
          .loader(require.resolve('stylus-loader'))
          .options(mergedOptions);
      });

      bundlerType === 'rspack' &&
        (api as any).modifyRspackConfig(async (rspackConfig: any) => {
          const { applyCSSModuleRule } = await import(
            '@rsbuild/core/rspack-plugin-css'
          );

          const config = api.getNormalizedConfig();

          const rules = rspackConfig.module?.rules;

          applyCSSModuleRule(rules, STYLUS_REGEX, config as any);
        });
    },
  };
}
