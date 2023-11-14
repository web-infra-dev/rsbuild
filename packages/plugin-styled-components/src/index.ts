import {
  isServerTarget,
  mergeChainedOptions,
  getDefaultStyledComponentsConfig,
  type ChainedConfig,
  type DefaultRsbuildPlugin,
} from '@rsbuild/shared';

/**
 * the options of [babel-plugin-styled-components](https://github.com/styled-components/babel-plugin-styled-components) or [rspackExperiments.styledComponents](https://rspack.dev/guide/loader.html#optionsrspackexperimentsstyledcomponents).
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
    api.modifyBundlerChain(async (chain, { CHAIN_ID, isProd }) => {
      const { bundlerType } = api.context;

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
          // apply swc
          if (rule.uses.has(CHAIN_ID.USE.SWC)) {
            // apply rspack builtin:swc-loader
            if (bundlerType === 'rspack') {
              rule.use(CHAIN_ID.USE.SWC).tap((options) => {
                options.rspackExperiments ??= {};
                options.rspackExperiments.styledComponents =
                  styledComponentsOptions;
                return options;
              });
            } else {
              // apply webpack swc-plugin
              rule.use(CHAIN_ID.USE.SWC).tap((swc) => {
                swc.extensions.styledComponents = styledComponentsOptions;
                return swc;
              });
            }
          } else if (rule.uses.has(CHAIN_ID.USE.BABEL)) {
            // apply babel
            rule.use(CHAIN_ID.USE.BABEL).tap((babelConfig) => {
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
    });
  },
});
