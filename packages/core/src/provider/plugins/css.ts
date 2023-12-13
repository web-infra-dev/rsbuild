import path from 'path';
import {
  getBrowserslistWithDefault,
  isUseCssExtract,
  CSS_REGEX,
  CSS_MODULES_REGEX,
  getCssLoaderOptions,
  setConfig,
  logger,
  getPostcssConfig,
  getCssModuleLocalIdentName,
  resolvePackage,
  mergeChainedOptions,
  getSharedPkgCompiledPath,
  type BundlerChain,
  type Context,
  type RspackRule,
  type RuleSetRule,
  type ModifyBundlerChainUtils,
} from '@rsbuild/shared';
import type { RsbuildPlugin, NormalizedConfig } from '../../types';

export const enableNativeCss = (config: NormalizedConfig) =>
  !config.output.injectStyles;

export async function applyBaseCSSRule({
  rule,
  config,
  context,
  utils: { target, isProd, isServer, isWebWorker, CHAIN_ID },
  importLoaders = 1,
}: {
  rule: ReturnType<BundlerChain['module']['rule']>;
  config: NormalizedConfig;
  context: Context;
  utils: ModifyBundlerChainUtils;
  importLoaders?: number;
}) {
  // 1. Check user config
  const enableCSSModuleTS = Boolean(config.output.enableCssModuleTSDeclaration);

  const browserslist = await getBrowserslistWithDefault(
    context.rootPath,
    config,
    target,
  );

  // when disableExtractCSS, use css-loader + style-loader
  if (!enableNativeCss(config)) {
    const localIdentName = getCssModuleLocalIdentName(config, isProd);

    const cssLoaderOptions = getCssLoaderOptions({
      config,
      importLoaders,
      isServer,
      isWebWorker,
      localIdentName,
    });

    if (!isServer && !isWebWorker) {
      const styleLoaderOptions = mergeChainedOptions({
        defaults: {
          // todo: hmr does not work while esModule is true
          // @ts-expect-error
          esModule: false,
        },
        options: config.tools.styleLoader,
      });

      rule
        .use(CHAIN_ID.USE.STYLE)
        .loader(require.resolve('style-loader'))
        .options(styleLoaderOptions)
        .end();

      // use css-modules-typescript-loader
      if (enableCSSModuleTS && cssLoaderOptions.modules) {
        rule
          .use(CHAIN_ID.USE.CSS_MODULES_TS)
          .loader(
            resolvePackage(
              '@rsbuild/shared/css-modules-typescript-loader',
              __dirname,
            ),
          )
          .options({
            modules: cssLoaderOptions.modules,
          })
          .end();
      }
    } else {
      rule
        .use(CHAIN_ID.USE.IGNORE_CSS)
        .loader(resolvePackage('@rsbuild/shared/ignore-css-loader', __dirname))
        .end();
    }

    rule
      .use(CHAIN_ID.USE.CSS)
      .loader(getSharedPkgCompiledPath('css-loader'))
      .options(cssLoaderOptions)
      .end();
  } else {
    // can not get experiment.css result, so we fake a css-modules-typescript-pre-loader
    if (!isServer && !isWebWorker && enableCSSModuleTS) {
      const { cssModules } = config.output;
      rule
        .use(CHAIN_ID.USE.CSS_MODULES_TS)
        .loader(path.resolve(__dirname, '../css-modules-typescript-pre-loader'))
        .options({
          modules: {
            exportLocalsConvention: cssModules.exportLocalsConvention,
            auto: cssModules.auto,
          },
        })
        .end();
    }

    rule.type('css');
  }

  if (!isServer && !isWebWorker) {
    const postcssLoaderOptions = getPostcssConfig({
      browserslist,
      config,
    });

    rule
      .use(CHAIN_ID.USE.POSTCSS)
      .loader(getSharedPkgCompiledPath('postcss-loader'))
      .options(postcssLoaderOptions)
      .end();
  }

  // CSS imports should always be treated as sideEffects
  rule.merge({ sideEffects: true });

  // Enable preferRelative by default, which is consistent with the default behavior of css-loader
  // see: https://github.com/webpack-contrib/css-loader/blob/579fc13/src/plugins/postcss-import-parser.js#L234
  rule.resolve.preferRelative(true);
}

/**
 * Use type: "css/module" rule instead of css-loader modules.auto config
 *
 * applyCSSModuleRule in modifyRspackConfig, so that other plugins can easily adjust css rule in Chain.
 */
export const applyCSSModuleRule = (
  rules: RspackRule[] | undefined,
  ruleTest: RegExp,
  config: NormalizedConfig,
) => {
  if (!rules || !enableNativeCss(config)) {
    return;
  }

  const ruleIndex = rules.findIndex((r) => r !== '...' && r.test === ruleTest);

  if (ruleIndex === -1) {
    return;
  }

  const cssModulesAuto = config.output.cssModules.auto;

  if (!cssModulesAuto) {
    return;
  }

  const rule = rules[ruleIndex] as RuleSetRule;

  const { test, type, ...rest } = rule;

  rules[ruleIndex] = {
    test: ruleTest,
    oneOf: [
      {
        ...rest,
        test:
          typeof cssModulesAuto !== 'boolean'
            ? cssModulesAuto
            : // auto: true
              CSS_MODULES_REGEX,
        type: 'css/module',
      },
      {
        ...rest,
        type: 'css',
      },
    ],
  };
};

export const pluginCss = (): RsbuildPlugin => {
  return {
    name: 'rsbuild:css',
    setup(api) {
      api.modifyBundlerChain(async (chain, utils) => {
        const config = api.getNormalizedConfig();

        const rule = chain.module.rule(utils.CHAIN_ID.RULE.CSS);
        rule.test(CSS_REGEX);

        await applyBaseCSSRule({
          rule,
          utils,
          config,
          context: api.context,
        });

        const enableExtractCSS = isUseCssExtract(config, utils.target);

        // TODO: there is no switch to turn off experiments.css sourcemap in rspack, so we manually remove css sourcemap in Rsbuild
        if (!config.output.sourceMap.css && enableExtractCSS) {
          const { RemoveCssSourcemapPlugin } = await import(
            '../../rspack/RemoveCssSourcemapPlugin'
          );
          chain
            .plugin('remove-css-sourcemap')
            .use(RemoveCssSourcemapPlugin, []);
        }
      });
      api.modifyRspackConfig(
        async (rspackConfig, { isProd, isServer, isWebWorker }) => {
          const config = api.getNormalizedConfig();

          if (!enableNativeCss(config)) {
            setConfig(rspackConfig, 'experiments.css', false);
            return;
          }

          let localIdentName =
            config.output.cssModules.localIdentName ||
            // Using shorter classname in production to reduce bundle size
            (isProd ? '[local]-[hash:6]' : '[path][name]__[local]-[hash:6]');

          if (localIdentName.includes(':base64')) {
            logger.warn(
              `Custom hashDigest in output.cssModules.localIdentName is currently not supported when using Rspack, the 'base64' will be ignored.`,
            );
            localIdentName = localIdentName.replace(':base64', '');
          }

          // need use type: "css/module" rule instead of modules.auto config
          setConfig(rspackConfig, 'builtins.css.modules', {
            localsConvention: config.output.cssModules.exportLocalsConvention,
            localIdentName,
            exportsOnly: isServer || isWebWorker,
          });

          const rules = rspackConfig.module?.rules;

          applyCSSModuleRule(rules, CSS_REGEX, config);
        },
      );
    },
  };
};
