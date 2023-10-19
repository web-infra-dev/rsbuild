import type { BuilderPlugin } from '@rsbuild/core';
import { isUseCssSourceMap, STYLUS_REGEX } from '@rsbuild/shared';
import type { BuilderPluginAPI } from '@rsbuild/webpack';

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
): BuilderPlugin<BuilderPluginAPI> {
  return {
    name: 'plugin-stylus',

    async setup(api) {
      const { bundlerType } = api.context;
      api.modifyBundlerChain(async (chain, utils) => {
        const config = api.getNormalizedConfig();
        const { applyOptionsChain } = await import('@modern-js/utils');

        const { merge: deepMerge } = await import('@modern-js/utils/lodash');

        const mergedOptions = applyOptionsChain<StylusLoaderOptions, undefined>(
          {
            sourceMap: isUseCssSourceMap(config),
          },
          options,
          undefined,
          deepMerge,
        );

        const rule = chain.module
          .rule(utils.CHAIN_ID.RULE.STYLUS)
          .test(STYLUS_REGEX);

        const { applyBaseCSSRule } = await import(
          bundlerType === 'webpack' ? '@rsbuild/webpack' : '@rsbuild/core'
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
            '@rsbuild/core/rspack-css-plugin'
          );

          const config = api.getNormalizedConfig();

          const rules = rspackConfig.module?.rules;

          applyCSSModuleRule(rules, STYLUS_REGEX, config as any);
        });
    },
  };
}
