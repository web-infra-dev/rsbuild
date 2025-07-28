import {
  logger,
  type NormalizedEnvironmentConfig,
  type Rspack,
} from '@rsbuild/core';
import type { webpack } from '@rsbuild/webpack';
import deepmerge from 'deepmerge';
import color from 'picocolors';
import { minify, minifyCss } from './binding.js';
import { JS_REGEX } from './constants.js';
import type { CssMinifyOptions, JsMinifyOptions, Output } from './types.js';

type SwcJsMinimizerRspackPluginOptions =
  Rspack.SwcJsMinimizerRspackPluginOptions;

export interface NormalizedSwcMinifyOption {
  jsMinify?: JsMinifyOptions;
  cssMinify?: CssMinifyOptions;
}

const normalize = <T>(
  v: T | boolean | undefined,
  defaultValue: T,
): T | undefined => {
  if (v === true || v === undefined) {
    return defaultValue;
  }
  if (v === false) {
    return undefined;
  }
  return v;
};

export const getSwcMinimizerOptions = (
  config: NormalizedEnvironmentConfig,
  jsOptions?: SwcJsMinimizerRspackPluginOptions,
): SwcJsMinimizerRspackPluginOptions => {
  const options: SwcJsMinimizerRspackPluginOptions = {};

  options.minimizerOptions ||= {};
  options.minimizerOptions.format ||= {};

  const { removeConsole } = config.performance;

  if (removeConsole === true) {
    options.minimizerOptions.compress = {
      drop_console: true,
    };
  } else if (Array.isArray(removeConsole)) {
    const pureFuncs = removeConsole.map((method) => `console.${method}`);
    options.minimizerOptions.compress = {
      pure_funcs: pureFuncs,
    };
  }

  switch (config.output.legalComments) {
    case 'inline':
      options.minimizerOptions.format.comments = 'some';
      options.extractComments = false;
      break;
    case 'linked':
      options.extractComments = true;
      break;
    case 'none':
      options.minimizerOptions.format.comments = false;
      options.extractComments = false;
      break;
    default:
      break;
  }

  options.minimizerOptions.format.asciiOnly = config.output.charset === 'ascii';

  if (jsOptions) {
    return deepmerge(options, jsOptions);
  }

  return options;
};

const CSS_REGEX = /\.css$/;

export class SwcMinimizerPlugin {
  private readonly minifyOptions: NormalizedSwcMinifyOption;

  private name = 'swc-minimizer-plugin';

  private sourceMapConfig: NormalizedEnvironmentConfig['output']['sourceMap'];

  constructor(options: {
    jsMinify?: boolean | JsMinifyOptions;
    cssMinify?: boolean | CssMinifyOptions;
    getEnvironmentConfig: () => NormalizedEnvironmentConfig;
  }) {
    const rsbuildConfig = options.getEnvironmentConfig();
    this.sourceMapConfig = rsbuildConfig.output.sourceMap;
    this.minifyOptions = {
      jsMinify: options.jsMinify
        ? deepmerge<JsMinifyOptions>(
            this.getDefaultJsMinifyOptions(rsbuildConfig),
            normalize(options.jsMinify, {}) ?? {},
          )
        : undefined,
      cssMinify: options.cssMinify
        ? normalize(options.cssMinify, {})
        : undefined,
    };
  }

  getDefaultJsMinifyOptions(
    environmentConfig: NormalizedEnvironmentConfig,
  ): JsMinifyOptions {
    const options: JsMinifyOptions = {
      ...getSwcMinimizerOptions(environmentConfig).minimizerOptions,
      mangle: true,
    };

    return options;
  }

  apply(compiler: webpack.Compiler): void {
    const meta = JSON.stringify({
      name: 'swc-minify',
      options: this.minifyOptions,
    });

    compiler.hooks.compilation.tap(this.name, async (compilation) => {
      const { Compilation } = compiler.webpack;
      const { devtool } = compilation.options;
      const { jsMinify, cssMinify } = this.minifyOptions;

      const enableSourceMap = Boolean(devtool);
      const inlineSourceContent =
        typeof devtool === 'string' && devtool.includes('inline');

      if (jsMinify) {
        jsMinify.sourceMap = enableSourceMap;
        jsMinify.inlineSourcesContent = inlineSourceContent;
      }

      if (cssMinify) {
        const userSourceMapCss =
          typeof this.sourceMapConfig === 'boolean'
            ? this.sourceMapConfig
            : this.sourceMapConfig.css;
        cssMinify.sourceMap =
          userSourceMapCss === undefined ? enableSourceMap : !!userSourceMapCss;
        cssMinify.inlineSourceContent = inlineSourceContent;
      }

      compilation.hooks.chunkHash.tap(this.name, (_, hash) =>
        hash.update(meta),
      );

      compilation.hooks.processAssets.tapPromise(
        {
          name: this.name,
          stage: Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE,
        },
        async () => {
          try {
            await this.updateAssets(compilation);
          } catch (e) {
            compilation.errors.push(
              new compiler.webpack.WebpackError(`[SWC Minify]: ${e}`),
            );
          }
        },
      );
    });
  }

  async updateAssets(compilation: webpack.Compilation): Promise<void[]> {
    const cache = compilation.getCache(this.name);

    const { SourceMapSource, RawSource } = compilation.compiler.webpack.sources;
    const assets = compilation
      .getAssets()
      .filter(
        (asset) =>
          !asset.info.minimized &&
          (JS_REGEX.test(asset.name) || CSS_REGEX.test(asset.name)),
      );

    const assetsWithCache = await Promise.all(
      assets.map(async ({ name, info, source }) => {
        const eTag = cache.getLazyHashedEtag(source);
        const cacheItem = cache.getItemCache(name, eTag);
        return {
          name,
          info,
          source,
          cacheItem,
        };
      }),
    );

    const { cssMinify, jsMinify } = this.minifyOptions;
    return Promise.all(
      assetsWithCache.map(async (asset) => {
        const cache = await asset.cacheItem.getPromise<{
          minifiedSource: InstanceType<
            typeof SourceMapSource | typeof RawSource
          >;
        }>();

        let minifiedSource = cache ? cache.minifiedSource : null;

        if (!minifiedSource) {
          const { source, map } = asset.source.sourceAndMap();
          let minifyResult: Output | undefined;
          let needSourceMap = false;
          const filename = asset.name;

          if (jsMinify && filename.endsWith('.js')) {
            needSourceMap = jsMinify.sourceMap!;
            minifyResult = await minifyWithTimeout(filename, () => {
              return minify(filename, source.toString(), jsMinify);
            });
          } else if (cssMinify && filename.endsWith('.css')) {
            needSourceMap = cssMinify.sourceMap!;
            minifyResult = await minifyWithTimeout(filename, () => {
              return minifyCss(filename, source.toString(), cssMinify);
            });
          }

          if (minifyResult) {
            minifiedSource =
              needSourceMap && minifyResult.map
                ? new SourceMapSource(
                    minifyResult.code,
                    asset.name,
                    minifyResult.map,
                    source.toString(),
                    map || undefined,
                    true,
                  )
                : new RawSource(minifyResult.code || '');
          }
        }

        if (minifiedSource) {
          await asset.cacheItem.storePromise({
            minifiedSource,
          });

          compilation.updateAsset(asset.name, minifiedSource, {
            ...asset.info,
            minimized: true,
          });
        }
      }),
    );
  }
}

/**
 * Currently SWC minify is not stable as we expected, there is a
 * change that it can never ends, so add a warning if it hangs too long.
 */
function minifyWithTimeout(
  filename: string,
  minify: () => Promise<Output>,
): Promise<Output> {
  const timer = setTimeout(() => {
    logger.warn(
      `SWC minimize has running for over 180 seconds for a single file: ${filename}\n
It is likely that you've encountered a ${color.red(
        'SWC internal bug',
      )}, please contact us at https://github.com/web-infra-dev/modern.js/issues`,
    );
  }, 180_000);

  const outputPromise = minify();

  outputPromise.finally(() => {
    clearTimeout(timer);
  });

  return outputPromise;
}
