import { posix } from 'node:path';
import type { AcceptedPlugin, PluginCreator } from 'postcss';
import postcssrc from 'postcss-load-config';
import { reduceConfigs, reduceConfigsWithContext } from 'reduce-configs';
import { castArray, color } from '../helpers';
import { getCompiledPath } from '../helpers/path';
import { findWorkspaceRoot } from '../helpers/workspace';
import type {
  ModifyBundlerChainUtils,
  NormalizedEnvironmentConfig,
  PostCSSLoaderOptions,
  PostCSSOptions,
  Rspack,
  RspackChain,
  ToolsPostCSSContext,
} from '../types';

export const getCSSOutputFilename = (
  distPath: string,
  filename: Rspack.CssFilename,
): Rspack.CssFilename =>
  typeof filename === 'function'
    ? (...args) => posix.join(distPath, filename(...args))
    : posix.join(distPath, filename);

export function getLightningCSSLoaderOptions(
  config: NormalizedEnvironmentConfig,
  targets: string[],
  minify: boolean,
): Promise<Rspack.LightningcssLoaderOptions> {
  const userOptions =
    typeof config.tools.lightningcssLoader === 'object'
      ? config.tools.lightningcssLoader
      : {};

  const initialOptions: Rspack.LightningcssLoaderOptions = {
    targets,
    errorRecovery: true,
  };

  if (minify) {
    initialOptions.minify = true;
  }

  return reduceConfigs<Rspack.LightningcssLoaderOptions>({
    initial: initialOptions,
    config: userOptions,
  });
}

// Create a new config object,
// ensure isolation of config objects between different builds
const clonePostCSSConfig = (config: PostCSSOptions) => ({
  ...config,
  plugins: config.plugins ? [...config.plugins] : undefined,
});

export const getCSSSourceMap = (
  config: NormalizedEnvironmentConfig,
): boolean => {
  const { sourceMap } = config.output;
  return typeof sourceMap === 'boolean' ? sourceMap : sourceMap.css;
};

async function loadUserPostcssrc(
  root: string,
  postcssrcCache: PostcssrcCache,
): Promise<PostCSSOptions> {
  const cached = postcssrcCache.get(root);

  if (cached) {
    return clonePostCSSConfig(await cached);
  }

  const promise = postcssrc({}, root, {
    stopDir: findWorkspaceRoot(root),
  }).catch((err: unknown) => {
    // ignore the config not found error
    if ((err as Error).message?.includes('No PostCSS Config found')) {
      return {};
    }
    throw err;
  });

  postcssrcCache.set(root, promise);

  return promise.then((config: PostCSSOptions) => {
    postcssrcCache.set(root, config);
    return clonePostCSSConfig(config);
  });
}

const isPostcssPluginCreator = (
  plugin: unknown,
): plugin is PluginCreator<unknown> =>
  typeof plugin === 'function' &&
  'postcss' in plugin &&
  Boolean(plugin.postcss);

const getPostcssLoaderOptions = async ({
  config,
  root,
  postcssrcCache,
}: {
  config: NormalizedEnvironmentConfig;
  root: string;
  postcssrcCache: PostcssrcCache;
}): Promise<PostCSSLoaderOptions> => {
  const extraPlugins: AcceptedPlugin[] = [];

  const context: ToolsPostCSSContext = {
    addPlugins(plugins: AcceptedPlugin | AcceptedPlugin[], options = {}) {
      const { order = 'post' } = options;
      const list = castArray(plugins);
      if (order === 'pre') {
        extraPlugins.unshift(...list);
      } else {
        extraPlugins.push(...list);
      }
    },
  };

  const userOptions = await loadUserPostcssrc(root, postcssrcCache);

  // init the plugins array
  userOptions.plugins ||= [];

  const defaultOptions: PostCSSLoaderOptions = {
    implementation: getCompiledPath('postcss'),
    postcssOptions: userOptions,
    sourceMap: getCSSSourceMap(config),
  };

  const finalOptions = await reduceConfigsWithContext({
    initial: defaultOptions,
    config: config.tools.postcss,
    ctx: context,
  });

  finalOptions.postcssOptions ||= {};

  const updatePostcssOptions = (options: PostCSSOptions) => {
    options.plugins ||= [];

    if (extraPlugins.length) {
      options.plugins.push(...extraPlugins);
    }

    // initialize the plugin to avoid multiple initialization
    // https://github.com/web-infra-dev/rsbuild/issues/3618
    options.plugins = options.plugins.map((plugin: unknown) =>
      isPostcssPluginCreator(plugin) ? plugin() : plugin,
    );

    // always use postcss-load-config to load external config
    options.config = false;

    return options;
  };

  const { postcssOptions } = finalOptions;
  if (typeof postcssOptions === 'function') {
    const postcssOptionsWrapper = (loaderContext: Rspack.LoaderContext) => {
      const options = postcssOptions(loaderContext);

      if (typeof options !== 'object' || options === null) {
        throw new Error(
          `${color.dim('[rsbuild:css]')} \`postcssOptions\` function must return a PostCSSOptions object, got ${color.yellow(
            typeof options,
          )}.`,
        );
      }

      const mergedOptions = {
        ...userOptions,
        ...options,
        plugins: [...(userOptions.plugins || []), ...(options.plugins || [])],
      };
      return updatePostcssOptions(mergedOptions);
    };

    // always use postcss-load-config to load external config
    postcssOptionsWrapper.config = false;

    return {
      ...finalOptions,
      postcssOptions: postcssOptionsWrapper,
    };
  }

  finalOptions.postcssOptions = updatePostcssOptions(postcssOptions);
  return finalOptions;
};

export type CSSRule = RspackChain.Rule<RspackChain.Rule>;

type PostcssrcCache = Map<string, PostCSSOptions | Promise<PostCSSOptions>>;

export function createPostCSSTransform(root: string) {
  const postcssrcCache: PostcssrcCache = new Map();
  return async (
    { environment, CHAIN_ID }: ModifyBundlerChainUtils,
    ...rules: (CSSRule | undefined)[]
  ): Promise<boolean> => {
    const options = await getPostcssLoaderOptions({
      config: environment.config,
      root,
      postcssrcCache,
    });
    if (
      typeof options.postcssOptions !== 'function' &&
      !options.postcssOptions?.plugins?.length
    ) {
      return false;
    }

    const loader = getCompiledPath('postcss-loader');
    for (const rule of rules) {
      rule?.use(CHAIN_ID.USE.POSTCSS).loader(loader).options(options);
    }
    return true;
  };
}
