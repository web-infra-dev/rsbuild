import { CSS_MODULES_REGEX, NODE_MODULES_REGEX } from './constants';
import type { AcceptedPlugin } from 'postcss';
import deepmerge from '../compiled/deepmerge';
import { getSharedPkgCompiledPath } from './utils';
import { mergeChainedOptions } from './mergeChainedOptions';
import type {
  RsbuildTarget,
  PostCSSOptions,
  CSSLoaderOptions,
  NormalizedConfig,
  PostCSSLoaderOptions,
} from './types';

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

  // todo: this configuration is not common and more complex.
  if (typeof modules === 'string') {
    return true;
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

  const autoprefixerOptions = mergeChainedOptions({
    defaults: {
      flexbox: 'no-2009',
      overrideBrowserslist: browserslist,
    },
    options: config.tools.autoprefixer,
  });

  const userPostcssConfig = await loadUserPostcssrc(root);

  const defaultPostcssConfig: PostCSSLoaderOptions = {
    postcssOptions: {
      ...userPostcssConfig,
      plugins: [
        ...(userPostcssConfig.plugins || []),
        require(getSharedPkgCompiledPath('postcss-flexbugs-fixes')),
        // Place autoprefixer as the last plugin to correctly process the results of other plugins
        // such as tailwindcss
        require(getSharedPkgCompiledPath('autoprefixer'))(autoprefixerOptions),
      ],
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

  const defaultOptions = {
    importLoaders,
    modules: {
      auto: cssModules.auto,
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
 * fix resolve-url-loader can't deal with resolve.alias config (such as @xxx、xxx)
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
