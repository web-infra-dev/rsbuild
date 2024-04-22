import type { AcceptedPlugin } from 'postcss';
import deepmerge from '../compiled/deepmerge';
import { CSS_MODULES_REGEX, NODE_MODULES_REGEX } from './constants';
import { mergeChainedOptions } from './mergeChainedOptions';
import type {
  CSSLoaderOptions,
  NormalizedConfig,
  PostCSSLoaderOptions,
  PostCSSOptions,
  RsbuildTarget,
} from './types';
import { isFunction, isPlainObject } from './utils';

export const getCssModuleLocalIdentName = (
  config: NormalizedConfig,
  isProd: boolean,
) =>
  config.output.cssModules.localIdentName ||
  // Using shorter classname in production to reduce bundle size
  (isProd
    ? '[local]-[hash:base64:6]'
    : '[path][name]__[local]-[hash:base64:6]');

export const isInNodeModules = (path: string) => NODE_MODULES_REGEX.test(path);

export type CssLoaderModules =
  | boolean
  | string
  | {
      auto: boolean | RegExp | ((filename: string) => boolean);
    };

export const isCssModules = (filename: string, modules: CssLoaderModules) => {
  if (typeof modules === 'boolean') {
    return modules;
  }

  // Same as the `mode` option
  // https://github.com/webpack-contrib/css-loader?tab=readme-ov-file#mode
  if (typeof modules === 'string') {
    // CSS Modules will be disabled if mode is 'global'
    return modules !== 'global';
  }

  const { auto } = modules;

  if (typeof auto === 'boolean') {
    return auto && CSS_MODULES_REGEX.test(filename);
  }
  if (auto instanceof RegExp) {
    return auto.test(filename);
  }
  if (typeof auto === 'function') {
    return auto(filename);
  }
  return true;
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
    '../compiled/postcss-load-config'
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
    const { default: autoprefixer } = await import('../compiled/autoprefixer');

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

export const getPostcssLoaderOptions = async ({
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

export const getCssLoaderOptions = ({
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

export const isUseCssExtract = (
  config: NormalizedConfig,
  target: RsbuildTarget,
) =>
  !config.output.injectStyles && target !== 'node' && target !== 'web-worker';

/**
 * fix resolve-url-loader can't deal with resolve.alias config
 *
 * reference: https://github.com/bholloway/resolve-url-loader/blob/e2695cde68f325f617825e168173df92236efb93/packages/resolve-url-loader/docs/advanced-features.md
 */
export const getResolveUrlJoinFn = async () => {
  const {
    createJoinFunction,
    asGenerator,
    createJoinImplementation,
    defaultJoinGenerator,
  } = await import('../compiled/resolve-url-loader');

  const rsbuildGenerator = asGenerator((item: any, ...rest: any[]) => {
    // only handle relative path (not absolutely accurate, but can meet common scenarios)
    if (!item.uri.startsWith('.')) {
      return [null];
    }
    return defaultJoinGenerator(item, ...rest);
  });
  return createJoinFunction(
    'rsbuild-resolve-join-fn',
    createJoinImplementation(rsbuildGenerator),
  );
};
