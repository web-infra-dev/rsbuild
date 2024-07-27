import path from 'node:path';
import browserslist from 'browserslist';
import deepmerge from 'deepmerge';
import type { AcceptedPlugin } from 'postcss';
import { reduceConfigs, reduceConfigsWithContext } from 'reduce-configs';
import { CSS_REGEX, LOADER_PATH } from '../constants';
import { getCompiledPath } from '../helpers/path';
import { getCssExtractPlugin } from '../pluginHelper';
import type {
  CSSLoaderModulesMode,
  CSSLoaderOptions,
  ModifyChainUtils,
  NormalizedEnvironmentConfig,
  PostCSSLoaderOptions,
  PostCSSOptions,
  RsbuildContext,
  RsbuildPlugin,
  RsbuildTarget,
  Rspack,
  RspackChain,
} from '../types';

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

const getPostcssLoaderOptions = async ({
  config,
  root,
}: {
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

  // init the plugins array
  userPostcssConfig.plugins ||= [];

  const defaultPostcssConfig: PostCSSLoaderOptions = {
    postcssOptions: userPostcssConfig,
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

const BROWSER_MAPPING: Record<string, string | null> = {
  and_chr: 'chrome',
  and_ff: 'firefox',
  ie_mob: 'ie',
  op_mob: 'opera',
  and_qq: null,
  and_uc: null,
  baidu: null,
  bb: null,
  kaios: null,
  op_mini: null,
};

function parseVersion(version: string) {
  const [major, minor = 0, patch = 0] = version
    .split('-')[0]
    .split('.')
    .map((v) => Number.parseInt(v, 10));

  if (Number.isNaN(major) || Number.isNaN(minor) || Number.isNaN(patch)) {
    return null;
  }

  return (major << 16) | (minor << 8) | patch;
}

// code modified based on https://github.com/parcel-bundler/lightningcss/blob/34b67a431c043fda5d4979bcdccb3008d082e243/node/browserslistToTargets.js
// MIT License
// TODO: no need to call browserslist in next Rspack version
function browserslistToTargets(browserslist: string[]): Record<string, number> {
  const targets: Record<string, number> = {};
  for (const browser of browserslist) {
    const [name, v] = browser.split(' ');
    if (BROWSER_MAPPING[name] === null) {
      continue;
    }

    const version = parseVersion(v);
    if (version == null) {
      continue;
    }

    if (targets[name] == null || version < targets[name]) {
      targets[name] = version;
    }
  }

  return targets;
}

async function applyCSSRule({
  rule,
  config,
  context,
  utils: { target, isProd, CHAIN_ID, environment },
}: {
  rule: RspackChain.Rule;
  config: NormalizedEnvironmentConfig;
  context: RsbuildContext;
  utils: ModifyChainUtils;
}) {
  // Check user config
  const enableExtractCSS = isUseCssExtract(config, target);

  // Create Rspack rule
  // Order: style-loader/CssExtractRspackPlugin -> css-loader -> postcss-loader
  if (target === 'web') {
    // use CssExtractRspackPlugin loader
    if (enableExtractCSS) {
      rule
        .use(CHAIN_ID.USE.MINI_CSS_EXTRACT)
        .loader(getCssExtractPlugin().loader)
        .options(config.tools.cssExtract.loaderOptions);
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
        .options(styleLoaderOptions);
    }
  } else {
    rule
      .use(CHAIN_ID.USE.IGNORE_CSS)
      .loader(path.join(LOADER_PATH, 'ignoreCssLoader.cjs'));
  }

  // Number of loaders applied before css-loader for `@import` at-rules
  let importLoaders = 0;

  rule.use(CHAIN_ID.USE.CSS).loader(getCompiledPath('css-loader'));

  if (target === 'web') {
    // `builtin:lightningcss-loader` is not supported when using webpack
    if (context.bundlerType === 'rspack') {
      importLoaders++;
      rule
        .use(CHAIN_ID.USE.LIGHTNINGCSS)
        .loader('builtin:lightningcss-loader')
        .options({
          targets: browserslistToTargets(
            browserslist(environment.browserslist),
          ),
        } satisfies Rspack.LightningcssLoaderOptions);
    }

    const postcssLoaderOptions = await getPostcssLoaderOptions({
      config,
      root: context.rootPath,
    });

    // enable postcss-loader if using PostCSS plugins
    if (postcssLoaderOptions.postcssOptions?.plugins?.length) {
      importLoaders++;
      rule
        .use(CHAIN_ID.USE.POSTCSS)
        .loader(getCompiledPath('postcss-loader'))
        .options(postcssLoaderOptions);
    }
  }

  const localIdentName = getCSSModulesLocalIdentName(config, isProd);
  const cssLoaderOptions = getCSSLoaderOptions({
    config,
    importLoaders,
    target,
    localIdentName,
  });
  rule.use(CHAIN_ID.USE.CSS).options(cssLoaderOptions);

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
  },
});
