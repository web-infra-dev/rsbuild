import path from 'node:path';
import {
  type AutoprefixerOptions,
  type CSSLoaderModulesMode,
  type CSSLoaderOptions,
  type ModifyChainUtils,
  type PostCSSLoaderOptions,
  type PostCSSOptions,
  type RsbuildContext,
  type RsbuildTarget,
  type RspackChain,
  deepmerge,
} from '@rsbuild/shared';
import type { AcceptedPlugin } from 'postcss';
import { CSS_REGEX, LOADER_PATH } from '../constants';
import { isFunction, isPlainObject } from '../helpers';
import { getCompiledPath } from '../helpers/path';
import { getCssExtractPlugin } from '../pluginHelper';
import { reduceConfigs, reduceConfigsWithContext } from '../reduceConfigs';
import type { NormalizedEnvironmentConfig, RsbuildPlugin } from '../types';

export const isUseCssExtract = (
  config: NormalizedEnvironmentConfig,
  target: RsbuildTarget,
): boolean =>
  !config.output.injectStyles && target !== 'node' && target !== 'web-worker';

const getCSSModulesLocalIdentName = (
  config: NormalizedEnvironmentConfig,
  isProd: boolean,
) =>
  config.output.cssModules.localIdentName ||
  // Using shorter classname in production to reduce bundle size
  (isProd
    ? '[local]-[hash:base64:6]'
    : '[path][name]__[local]-[hash:base64:6]');

// If the target is not `web` and the modules option of css-loader is enabled,
// we must enable exportOnlyLocals to only exports the modules identifier mappings.
// Otherwise, the compiled CSS code may contain invalid code, such as `new URL`.
// https://github.com/webpack-contrib/css-loader#exportonlylocals
export const normalizeCssLoaderOptions = (
  options: CSSLoaderOptions,
  exportOnlyLocals: boolean,
): CSSLoaderOptions => {
  if (options.modules && exportOnlyLocals) {
    let { modules } = options;
    if (modules === true) {
      modules = { exportOnlyLocals: true };
    } else if (typeof modules === 'string') {
      modules = {
        mode: modules as CSSLoaderModulesMode,
        exportOnlyLocals: true,
      };
    } else {
      // create a new object to avoid modifying the original options
      modules = {
        ...modules,
        exportOnlyLocals: true,
      };
    }

    return {
      ...options,
      modules,
    };
  }

  return options;
};

const userPostcssrcCache = new Map<
  string,
  PostCSSOptions | Promise<PostCSSOptions>
>();

async function loadUserPostcssrc(root: string): Promise<PostCSSOptions> {
  const cached = userPostcssrcCache.get(root);

  if (cached) {
    return cached;
  }

  const { default: postcssrc } = await import('postcss-load-config');

  const promise = postcssrc({}, root).catch((err: Error) => {
    // ignore the config not found error
    if (err.message?.includes('No PostCSS Config found')) {
      return {};
    }
    throw err;
  });

  userPostcssrcCache.set(root, promise);

  promise.then((config: PostCSSOptions) => {
    userPostcssrcCache.set(root, config);
  });

  return promise;
}

/**
 * Apply autoprefixer to the postcss plugins
 * Check if autoprefixer is already in the plugins, if not, add it
 */
export const applyAutoprefixer = async (
  plugins: unknown[],
  browserslist: string[],
  config: NormalizedEnvironmentConfig,
): Promise<AcceptedPlugin[]> => {
  const pluginObjects: AcceptedPlugin[] = plugins.map((plugin) =>
    isFunction(plugin) ? plugin({}) : plugin,
  );

  const hasAutoprefixer = pluginObjects.some((pluginObject) => {
    if (isPlainObject(pluginObject) && 'postcssPlugin' in pluginObject) {
      return pluginObject.postcssPlugin === 'autoprefixer';
    }
    return false;
  });

  if (!hasAutoprefixer) {
    const { default: autoprefixer } = await import(
      '@rsbuild/shared/autoprefixer'
    );

    const autoprefixerOptions = reduceConfigs<AutoprefixerOptions>({
      initial: {
        flexbox: 'no-2009',
        overrideBrowserslist: browserslist,
      },
      config: config.tools.autoprefixer,
    });

    // Place autoprefixer as the last plugin to correctly process the results of other plugins
    // such as tailwindcss
    pluginObjects.push(autoprefixer(autoprefixerOptions));
  }

  return pluginObjects;
};

const getPostcssLoaderOptions = async ({
  browserslist,
  config,
  root,
}: {
  browserslist: string[];
  config: NormalizedEnvironmentConfig;
  root: string;
}): Promise<PostCSSLoaderOptions> => {
  const extraPlugins: AcceptedPlugin[] = [];

  const utils = {
    addPlugins(plugins: AcceptedPlugin | AcceptedPlugin[]) {
      if (Array.isArray(plugins)) {
        extraPlugins.push(...plugins);
      } else {
        extraPlugins.push(plugins);
      }
    },
  };

  const userPostcssConfig = await loadUserPostcssrc(root);

  let postcssPlugins = userPostcssConfig.plugins?.slice() || [];

  postcssPlugins = await applyAutoprefixer(
    postcssPlugins,
    browserslist,
    config,
  );

  const defaultPostcssConfig: PostCSSLoaderOptions = {
    postcssOptions: {
      ...userPostcssConfig,
      plugins: postcssPlugins,
    },
    sourceMap: config.output.sourceMap.css,
  };

  const mergedConfig = reduceConfigsWithContext({
    initial: defaultPostcssConfig,
    config: config.tools.postcss,
    ctx: utils,
  });

  if (extraPlugins.length) {
    mergedConfig?.postcssOptions?.plugins!.push(...extraPlugins);
  }

  // always use postcss-load-config to load external config
  mergedConfig.postcssOptions ||= {};
  mergedConfig.postcssOptions.config = false;

  return mergedConfig;
};

const getCSSLoaderOptions = ({
  config,
  importLoaders,
  target,
  localIdentName,
}: {
  config: NormalizedEnvironmentConfig;
  importLoaders: number;
  target: RsbuildTarget;
  localIdentName: string;
}) => {
  const { cssModules } = config.output;

  const defaultOptions: CSSLoaderOptions = {
    importLoaders,
    modules: {
      ...cssModules,
      localIdentName,
    },
    sourceMap: config.output.sourceMap.css,
  };

  const mergedCssLoaderOptions = reduceConfigs({
    initial: defaultOptions,
    config: config.tools.cssLoader,
    mergeFn: deepmerge,
  });

  const cssLoaderOptions = normalizeCssLoaderOptions(
    mergedCssLoaderOptions,
    target !== 'web',
  );

  return cssLoaderOptions;
};

async function applyCSSRule({
  rule,
  config,
  context,
  utils: { target, isProd, CHAIN_ID, environment },
  importLoaders = 1,
}: {
  rule: RspackChain.Rule;
  config: NormalizedEnvironmentConfig;
  context: RsbuildContext;
  utils: ModifyChainUtils;
  importLoaders?: number;
}) {
  const { browserslist } = environment;

  // 1. Check user config
  const enableExtractCSS = isUseCssExtract(config, target);

  // 2. Prepare loader options
  const localIdentName = getCSSModulesLocalIdentName(config, isProd);

  const cssLoaderOptions = getCSSLoaderOptions({
    config,
    importLoaders,
    target,
    localIdentName,
  });

  // 3. Create Rspack rule
  // Order: style-loader/CssExtractRspackPlugin -> css-loader -> postcss-loader
  if (target === 'web') {
    // use CssExtractRspackPlugin loader
    if (enableExtractCSS) {
      rule
        .use(CHAIN_ID.USE.MINI_CSS_EXTRACT)
        .loader(getCssExtractPlugin().loader)
        .options(config.tools.cssExtract.loaderOptions)
        .end();
    }
    // use style-loader
    else {
      const styleLoaderOptions = reduceConfigs({
        initial: {},
        config: config.tools.styleLoader,
      });

      rule
        .use(CHAIN_ID.USE.STYLE)
        .loader(getCompiledPath('style-loader'))
        .options(styleLoaderOptions)
        .end();
    }
  } else {
    rule
      .use(CHAIN_ID.USE.IGNORE_CSS)
      .loader(path.join(LOADER_PATH, 'ignoreCssLoader.cjs'))
      .end();
  }

  rule
    .use(CHAIN_ID.USE.CSS)
    .loader(getCompiledPath('css-loader'))
    .options(cssLoaderOptions)
    .end();

  if (target === 'web') {
    const postcssLoaderOptions = await getPostcssLoaderOptions({
      browserslist,
      config,
      root: context.rootPath,
    });

    rule
      .use(CHAIN_ID.USE.POSTCSS)
      .loader(getCompiledPath('postcss-loader'))
      .options(postcssLoaderOptions)
      .end();
  }

  // CSS imports should always be treated as sideEffects
  rule.merge({ sideEffects: true });

  // Enable preferRelative by default, which is consistent with the default behavior of css-loader
  // see: https://github.com/webpack-contrib/css-loader/blob/579fc13/src/plugins/postcss-import-parser.js#L234
  rule.resolve.preferRelative(true);
}

export const pluginCss = (): RsbuildPlugin => ({
  name: 'rsbuild:css',
  setup(api) {
    api.modifyBundlerChain({
      order: 'pre',
      handler: async (chain, utils) => {
        const rule = chain.module.rule(utils.CHAIN_ID.RULE.CSS);
        const { config } = utils.environment;
        rule.test(CSS_REGEX);
        await applyCSSRule({
          rule,
          utils,
          config,
          context: api.context,
        });
      },
    });

    api.modifyRspackConfig(async (rspackConfig) => {
      rspackConfig.experiments ||= {};
      rspackConfig.experiments.css = false;
    });
  },
});
