import { posix } from 'node:path';
import {
  DEFAULT_ASSET_PREFIX,
  DEFAULT_DEV_HOST,
  DEFAULT_PORT,
  type NormalizedConfig,
  type RsbuildContext,
  getDistPath,
  getFilename,
} from '@rsbuild/shared';
import { rspack } from '@rspack/core';
import { formatPublicPath } from '../helpers';
import { getCssExtractPlugin } from '../pluginHelper';
import type { RsbuildPlugin } from '../types';
import { isUseCssExtract } from './css';

function getPublicPath({
  isProd,
  config,
  context,
}: {
  isProd: boolean;
  config: NormalizedConfig;
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
      async (
        chain,
        { CHAIN_ID, target, isProd, isServer, isServiceWorker },
      ) => {
        const config = api.getNormalizedConfig();

        const publicPath = getPublicPath({
          config,
          isProd,
          context: api.context,
        });

        // js output
        const jsPath = getDistPath(config, 'js');
        const jsAsyncPath = getDistPath(config, 'jsAsync');
        const jsFilename = getFilename(config, 'js', isProd);

        chain.output
          .path(api.context.distPath)
          .filename(posix.join(jsPath, jsFilename))
          .chunkFilename(posix.join(jsAsyncPath, jsFilename))
          .publicPath(publicPath)
          // disable pathinfo to improve compile performance
          // the path info is useless in most cases
          // see: https://webpack.js.org/guides/build-performance/#output-without-path-info
          .pathinfo(false)
          // since webpack v5.54.0+, hashFunction supports xxhash64 as a faster algorithm
          // which will be used as default when experiments.futureDefaults is enabled.
          .hashFunction('xxhash64');

        if (isServer) {
          const serverPath = getDistPath(config, 'server');

          chain.output
            .path(posix.join(api.context.distPath, serverPath))
            .filename('[name].js')
            .chunkFilename('[name].js')
            .library({
              ...(chain.output.get('library') || {}),
              type: 'commonjs2',
            });
        }

        if (isServiceWorker) {
          const workerPath = getDistPath(config, 'worker');
          const filename = posix.join(workerPath, '[name].js');

          chain.output.filename(filename).chunkFilename(filename);
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

          const cssPath = getDistPath(config, 'css');
          const cssFilename = getFilename(config, 'css', isProd);
          const cssAsyncPath = getDistPath(config, 'cssAsync');

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
