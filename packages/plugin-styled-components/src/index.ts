import {
  DefaultRsbuildPlugin,
  getDefaultStyledComponentsConfig,
  mergeChainedOptions,
} from '@rsbuild/shared';

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
  userConfig: StyledComponentsOptions = {},
): DefaultRsbuildPlugin => ({
  name: 'plugin-styled-components',

  setup(api) {
    const { bundlerType } = api.context;

    if (bundlerType !== 'rspack') {
      return;
    }

    api.modifyBundlerChain(async (chain, { CHAIN_ID, isProd, target }) => {
      const rule = chain.module.rule(CHAIN_ID.RULE.JS);
      const isSSR = target === 'node';

      const styledComponentsOptions = mergeChainedOptions<
        StyledComponentsOptions,
        {}
      >(getDefaultStyledComponentsConfig(isProd, isSSR), userConfig);

      if (!styledComponentsOptions) {
        return;
      }

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
    });
  },
});
