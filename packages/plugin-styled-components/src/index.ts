import {
  DefaultRsbuildPlugin,
  getDefaultStyledComponentsConfig,
  mergeChainedOptions,
  ChainedConfig,
} from '@rsbuild/shared';

/**
 * the options of [babel-plugin-styled-components](https://github.com/styled-components/babel-plugin-styled-components) or [rspackExperiments.styledComponents](https://www.rspack.dev/guide/loader.html#optionsrspackexperimentsstyledcomponents).
 */
type StyledComponentsOptions = {
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
  userConfig: ChainedConfig<StyledComponentsOptions> = {},
): DefaultRsbuildPlugin => ({
  name: 'plugin-styled-components',

  setup(api) {
    api.modifyBundlerChain(async (chain, { CHAIN_ID, isProd, target }) => {
      const { bundlerType } = api.context;

      const isSSR = target === 'node';

      const styledComponentsOptions = mergeChainedOptions<
        StyledComponentsOptions,
        {}
      >(getDefaultStyledComponentsConfig(isProd, isSSR), userConfig);

      if (!styledComponentsOptions) {
        return;
      }

      if (bundlerType === 'rspack') {
        const rule = chain.module.rule(CHAIN_ID.RULE.JS);

        rule.use(CHAIN_ID.USE.SWC).tap((options) => {
          options.rspackExperiments ??= {};
          options.rspackExperiments.styledComponents = styledComponentsOptions;
          return options;
        });

        if (chain.module.rules.has(CHAIN_ID.RULE.JS_DATA_URI)) {
          chain.module
            .rule(CHAIN_ID.RULE.JS_DATA_URI)
            .use(CHAIN_ID.USE.SWC)
            .tap((options) => {
              options.rspackExperiments ??= {};
              options.rspackExperiments.styledComponents =
                styledComponentsOptions;
              return options;
            });
        }
      } else {
        const rule = chain.module.rule(CHAIN_ID.RULE.JS);
        rule.use(CHAIN_ID.USE.BABEL).tap((babelConfig) => {
          babelConfig.plugins ??= [];
          babelConfig.plugins.push([
            require.resolve('babel-plugin-styled-components'),
            styledComponentsOptions,
          ]);
          return babelConfig;
        });

        if (chain.module.rules.has(CHAIN_ID.RULE.JS_DATA_URI)) {
          chain.module
            .rule(CHAIN_ID.RULE.JS_DATA_URI)
            .use(CHAIN_ID.USE.BABEL)
            .tap((babelConfig) => {
              babelConfig.plugins ??= [];
              babelConfig.plugins.push([
                require.resolve('babel-plugin-styled-components'),
                styledComponentsOptions,
              ]);
              return babelConfig;
            });
        }
      }
    });
  },
});
