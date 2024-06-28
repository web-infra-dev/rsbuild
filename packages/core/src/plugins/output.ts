import { posix } from 'node:path';
import type {
  NormalizedEnvironmentConfig,
  RsbuildContext,
} from '@rsbuild/shared';
import { rspack } from '@rspack/core';
import {
  DEFAULT_ASSET_PREFIX,
  DEFAULT_DEV_HOST,
  DEFAULT_PORT,
} from '../constants';
import { formatPublicPath, getFilename } from '../helpers';
import { getCssExtractPlugin } from '../pluginHelper';
import type { RsbuildPlugin } from '../types';
import { isUseCssExtract } from './css';

function getPublicPath({
  isProd,
  config,
  context,
}: {
  isProd: boolean;
  config: NormalizedEnvironmentConfig;
  context: RsbuildContext;
}) {
  const { dev, output } = config;

  let publicPath = DEFAULT_ASSET_PREFIX;

  if (isProd) {
    if (typeof output.assetPrefix === 'string') {
      publicPath = output.assetPrefix;
    }
  } else if (typeof dev.assetPrefix === 'string') {
    publicPath = dev.assetPrefix;
  } else if (dev.assetPrefix === true) {
    const protocol = context.devServer?.https ? 'https' : 'http';
    const hostname = context.devServer?.hostname || DEFAULT_DEV_HOST;
    const port = context.devServer?.port || DEFAULT_PORT;
    if (hostname === DEFAULT_DEV_HOST) {
      const localHostname = 'localhost';
      // If user not specify the hostname, it would use 0.0.0.0
      // The http://0.0.0.0:port can't visit in windows, so we shouldn't set publicPath as `//0.0.0.0:${port}/`;
      // Relative to docs:
      // - https://github.com/quarkusio/quarkus/issues/12246
      publicPath = `${protocol}://${localHostname}:${port}/`;
    } else {
      publicPath = `${protocol}://${hostname}:${port}/`;
    }
  }

  return formatPublicPath(publicPath);
}

export const pluginOutput = (): RsbuildPlugin => ({
  name: 'rsbuild:output',

  setup(api) {
    api.modifyBundlerChain(
      async (chain, { CHAIN_ID, target, isProd, isServer, environment }) => {
        const { distPath, config } = environment;

        const publicPath = getPublicPath({
          config,
          isProd,
          context: api.context,
        });

        // js output
        const jsPath = config.output.distPath.js;
        const jsAsyncPath =
          config.output.distPath.jsAsync ??
          (jsPath ? `${jsPath}/async` : 'async');
        const jsFilename = getFilename(config, 'js', isProd);
        const isJsFilenameFn = typeof jsFilename === 'function';

        chain.output
          .path(distPath)
          .filename(
            isJsFilenameFn
              ? (...args) => {
                  const name = jsFilename(...args);
                  return posix.join(jsPath, name);
                }
              : posix.join(jsPath, jsFilename),
          )
          .chunkFilename(
            isJsFilenameFn
              ? (...args) => {
                  const name = jsFilename(...args);
                  return posix.join(jsAsyncPath, name);
                }
              : posix.join(jsAsyncPath, jsFilename),
          )
          .publicPath(publicPath)
          // disable pathinfo to improve compile performance
          // the path info is useless in most cases
          // see: https://webpack.js.org/guides/build-performance/#output-without-path-info
          .pathinfo(false)
          // since webpack v5.54.0+, hashFunction supports xxhash64 as a faster algorithm
          // which will be used as default when experiments.futureDefaults is enabled.
          .hashFunction('xxhash64');

        if (isServer) {
          chain.output
            .filename('[name].js')
            .chunkFilename('[name].js')
            .library({
              ...(chain.output.get('library') || {}),
              type: 'commonjs2',
            });
        }

        if (config.output.copy && api.context.bundlerType === 'rspack') {
          const { copy } = config.output;
          const options = Array.isArray(copy) ? { patterns: copy } : copy;

          chain
            .plugin(CHAIN_ID.PLUGIN.COPY)
            .use(rspack.CopyRspackPlugin, [options]);
        }

        // css output
        if (isUseCssExtract(config, target)) {
          const extractPluginOptions = config.tools.cssExtract.pluginOptions;

          const cssPath = config.output.distPath.css;
          const cssFilename = getFilename(config, 'css', isProd);
          const cssAsyncPath =
            config.output.distPath.cssAsync ??
            (cssPath ? `${cssPath}/async` : 'async');

          chain
            .plugin(CHAIN_ID.PLUGIN.MINI_CSS_EXTRACT)
            .use(getCssExtractPlugin(), [
              {
                filename: posix.join(cssPath, cssFilename),
                chunkFilename: posix.join(cssAsyncPath, cssFilename),
                ...extractPluginOptions,
              },
            ]);
        }
      },
    );
  },
});
