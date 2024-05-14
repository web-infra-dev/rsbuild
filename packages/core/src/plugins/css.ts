import path from 'node:path';
import {
  type BundlerChainRule,
  type CSSExtractOptions,
  type CSSLoaderOptions,
  CSS_REGEX,
  type ModifyChainUtils,
  type PostCSSLoaderOptions,
  type PostCSSOptions,
  type RsbuildContext,
  type RsbuildTarget,
  deepmerge,
  getBrowserslistWithDefault,
  isFunction,
  isPlainObject,
  mergeChainedOptions,
} from '@rsbuild/shared';
import type { AcceptedPlugin } from 'postcss';
import { getCssExtractPlugin } from '../pluginHelper';
import { getCompiledPath } from '../provider/shared';
import type { NormalizedConfig, RsbuildPlugin } from '../types';

export const enableNativeCss = (config: NormalizedConfig) =>
  !config.output.injectStyles;

export const isUseCssExtract = (
  config: NormalizedConfig,
  target: RsbuildTarget,
) =>
  !config.output.injectStyles && target !== 'node' && target !== 'web-worker';

const getCssModuleLocalIdentName = (
  config: NormalizedConfig,
  isProd: boolean,
) =>
  config.output.cssModules.localIdentName ||
  // Using shorter classname in production to reduce bundle size
  (isProd
    ? '[local]-[hash:base64:6]'
    : '[path][name]__[local]-[hash:base64:6]');

// If the target is 'node' or 'web-worker' and the modules option of css-loader is enabled,
// we must enable exportOnlyLocals to only exports the modules identifier mappings.
// Otherwise, the compiled CSS code may contain invalid code, such as `new URL`.
// https://github.com/webpack-contrib/css-loader#exportonlylocals
export const normalizeCssLoaderOptions = (
  options: CSSLoaderOptions,
  exportOnlyLocals: boolean,
) => {
  if (options.modules && exportOnlyLocals) {
    let { modules } = options;
    if (modules === true) {
      modules = { exportOnlyLocals: true };
    } else if (typeof modules === 'string') {
      modules = { mode: modules, exportOnlyLocals: true };
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

  const { default: postcssrc } = await import(
    '../../compiled/postcss-load-config'
  );

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
  config: NormalizedConfig,
) => {
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

    const autoprefixerOptions = mergeChainedOptions({
      defaults: {
        flexbox: 'no-2009',
        overrideBrowserslist: browserslist,
      },
      options: config.tools.autoprefixer,
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
  config: NormalizedConfig;
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

  const mergedConfig = mergeChainedOptions({
    defaults: defaultPostcssConfig,
    options: config.tools.postcss,
    utils,
  });

  if (extraPlugins.length) {
    mergedConfig?.postcssOptions?.plugins!.push(...extraPlugins);
  }

  // always use postcss-load-config to load external config
  mergedConfig.postcssOptions ||= {};
  mergedConfig.postcssOptions.config = false;

  return mergedConfig;
};

const getCssLoaderOptions = ({
  config,
  importLoaders,
  isServer,
  isWebWorker,
  localIdentName,
}: {
  config: NormalizedConfig;
  importLoaders: number;
  isServer: boolean;
  isWebWorker: boolean;
  localIdentName: string;
}) => {
  const { cssModules } = config.output;

  const defaultOptions: CSSLoaderOptions = {
    importLoaders,
    modules: {
      auto: cssModules.auto,
      namedExport: false,
      exportLocalsConvention: cssModules.exportLocalsConvention,
      localIdentName,
    },
    sourceMap: config.output.sourceMap.css,
  };

  const mergedCssLoaderOptions = mergeChainedOptions({
    defaults: defaultOptions,
    options: config.tools.cssLoader,
    mergeFn: deepmerge,
  });

  const cssLoaderOptions = normalizeCssLoaderOptions(
    mergedCssLoaderOptions,
    isServer || isWebWorker,
  );

  return cssLoaderOptions;
};

export async function applyCSSRule({
  rule,
  config,
  context,
  utils: { target, isProd, isServer, CHAIN_ID, isWebWorker },
  importLoaders = 1,
}: {
  rule: BundlerChainRule;
  config: NormalizedConfig;
  context: RsbuildContext;
  utils: ModifyChainUtils;
  importLoaders?: number;
}) {
  const browserslist = await getBrowserslistWithDefault(
    context.rootPath,
    config,
    target,
  );

  // 1. Check user config
  const enableExtractCSS = isUseCssExtract(config, target);

  // 2. Prepare loader options
  const localIdentName = getCssModuleLocalIdentName(config, isProd);

  const cssLoaderOptions = getCssLoaderOptions({
    config,
    importLoaders,
    isServer,
    isWebWorker,
    localIdentName,
  });

  // 3. Create webpack rule
  // Order: style-loader/mini-css-extract -> css-loader -> postcss-loader
  if (!isServer && !isWebWorker) {
    // use mini-css-extract-plugin loader
    if (enableExtractCSS) {
      const extraCSSOptions: Required<CSSExtractOptions> =
        typeof config.tools.cssExtract === 'object'
          ? config.tools.cssExtract
          : {
              loaderOptions: {},
              pluginOptions: {},
            };

      rule
        .use(CHAIN_ID.USE.MINI_CSS_EXTRACT)
        .loader(getCssExtractPlugin().loader)
        .options(extraCSSOptions.loaderOptions)
        .end();
    }
    // use style-loader
    else {
      const styleLoaderOptions = mergeChainedOptions({
        defaults: {},
        options: config.tools.styleLoader,
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
      .loader(path.resolve(__dirname, '../rspack/ignoreCssLoader'))
      .end();
  }

  rule
    .use(CHAIN_ID.USE.CSS)
    .loader(getCompiledPath('css-loader'))
    .options(cssLoaderOptions)
    .end();

  if (!isServer && !isWebWorker) {
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

export const pluginCss = (): RsbuildPlugin => {
  return {
    name: 'rsbuild:css',
    setup(api) {
      api.modifyBundlerChain(async (chain, utils) => {
        const rule = chain.module.rule(utils.CHAIN_ID.RULE.CSS);
        const config = api.getNormalizedConfig();
        rule.test(CSS_REGEX);
        await applyCSSRule({
          rule,
          utils,
          config,
          context: api.context,
        });
      });

      api.modifyRspackConfig(async (rspackConfig) => {
        rspackConfig.experiments ||= {};
        rspackConfig.experiments.css = false;
      });
    },
  };
};
