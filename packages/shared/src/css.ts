import assert from 'assert';
import {
  CSS_MODULES_REGEX,
  GLOBAL_CSS_REGEX,
  NODE_MODULES_REGEX,
} from './constants';
import type { AcceptedPlugin, ProcessOptions } from 'postcss';
import deepmerge from 'deepmerge';
import { getSharedPkgCompiledPath as getCompiledPath } from './utils';
import { mergeChainedOptions } from './mergeChainedOptions';
import type {
  CssModules,
  RsbuildTarget,
  CSSLoaderOptions,
  NormalizedConfig,
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

/** Determine if a file path is a CSS module when disableCssModuleExtension is enabled. */
export const isLooseCssModules = (path: string) => {
  if (NODE_MODULES_REGEX.test(path)) {
    return CSS_MODULES_REGEX.test(path);
  }
  return !GLOBAL_CSS_REGEX.test(path);
};

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
  } else if (auto instanceof RegExp) {
    return auto.test(filename);
  } else if (typeof auto === 'function') {
    return auto(filename);
  }
  return true;
};

export const getCssModulesAutoRule = (
  config?: CssModules,
  disableCssModuleExtension = false,
) => {
  if (!config || config?.auto === undefined) {
    return disableCssModuleExtension ? isLooseCssModules : true;
  }

  return config.auto;
};

type CssNanoOptions = {
  configFile?: string | undefined;
  preset?: [string, object] | string | undefined;
};

export const getCssnanoDefaultOptions = (): CssNanoOptions => ({
  preset: [
    'default',
    {
      // merge longhand will break safe-area-inset-top, so disable it
      // https://github.com/cssnano/cssnano/issues/803
      // https://github.com/cssnano/cssnano/issues/967
      mergeLonghand: false,
    },
  ],
});

export const getPostcssConfig = ({
  enableCssMinify,
  enableSourceMap,
  browserslist,
  config,
}: {
  enableCssMinify: boolean;
  enableSourceMap: boolean;
  browserslist: string[];
  config: NormalizedConfig;
}) => {
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

  const defaultPostcssConfig = {
    postcssOptions: {
      plugins: [
        require(getCompiledPath('postcss-flexbugs-fixes')),
        require(getCompiledPath('autoprefixer'))(autoprefixerOptions),
        // TODO consider use lightingcss or move to the CSS minimizer plugin
        // enableCssMinify
        //   ? require('cssnano')(getCssnanoDefaultOptions())
        //   : false,
      ].filter(Boolean),
    },
    sourceMap: enableSourceMap,
  };

  const mergedConfig = mergeChainedOptions({
    defaults: defaultPostcssConfig,
    options: config.tools.postcss,
    utils,
  });
  if (extraPlugins.length) {
    assert('postcssOptions' in mergedConfig);
    assert('plugins' in mergedConfig.postcssOptions!);
    mergedConfig.postcssOptions.plugins!.push(...extraPlugins);
  }

  return mergedConfig as ProcessOptions & {
    postcssOptions: {
      plugins?: AcceptedPlugin[];
    };
  };
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
  enableSourceMap,
  importLoaders,
  isServer,
  isWebWorker,
  localIdentName,
}: {
  config: NormalizedConfig;
  enableSourceMap: boolean;
  importLoaders: number;
  isServer: boolean;
  isWebWorker: boolean;
  localIdentName: string;
}) => {
  const { cssModules } = config.output;

  const defaultOptions = {
    importLoaders,
    modules: {
      auto: getCssModulesAutoRule(
        cssModules,
        config.output.disableCssModuleExtension,
      ),
      exportLocalsConvention: cssModules.exportLocalsConvention,
      localIdentName,
    },
    sourceMap: enableSourceMap,
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
  !config.output.disableCssExtract &&
  target !== 'node' &&
  target !== 'web-worker';

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
