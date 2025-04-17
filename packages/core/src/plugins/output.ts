import { posix } from 'node:path';
import { rspack } from '@rspack/core';
import {
  DEFAULT_ASSET_PREFIX,
  DEFAULT_DEV_HOST,
  DEFAULT_PORT,
} from '../constants';
import { formatPublicPath, getFilename, urlJoin } from '../helpers';
import { replacePortPlaceholder } from '../server/open';
import type {
  NormalizedEnvironmentConfig,
  RsbuildContext,
  RsbuildPlugin,
} from '../types';

function getPublicPath({
  isProd,
  config,
  context,
}: {
  isProd: boolean;
  config: NormalizedEnvironmentConfig;
  context: RsbuildContext;
}) {
  const { dev, output, server } = config;

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

    if (hostname === DEFAULT_DEV_HOST) {
      const localHostname = 'localhost';
      // If user not specify the hostname, it would use 0.0.0.0
      // The http://0.0.0.0:port can't visit on Windows, so we shouldn't set publicPath as `//0.0.0.0:${port}/`;
      // Relative to docs:
      // - https://github.com/quarkusio/quarkus/issues/12246
      publicPath = `${protocol}://${localHostname}:<port>/`;
    } else {
      publicPath = `${protocol}://${hostname}:<port>/`;
    }

    if (server.base && server.base !== '/') {
      publicPath = urlJoin(publicPath, server.base);
    }
  }

  const port = (isProd ? server.port : context.devServer?.port) ?? DEFAULT_PORT;
  return formatPublicPath(replacePortPlaceholder(publicPath, port));
}

const getJsAsyncPath = (
  jsPath: string,
  isServer: boolean,
  jsAsync?: string,
) => {
  if (jsAsync !== undefined) {
    return jsAsync;
  }
  if (isServer) {
    return jsPath;
  }

  return jsPath ? `${jsPath}/async` : 'async';
};

export const pluginOutput = (): RsbuildPlugin => ({
  name: 'rsbuild:output',

  setup(api) {
    api.modifyBundlerChain(
      async (chain, { CHAIN_ID, isProd, isServer, environment }) => {
        const { distPath, config } = environment;

        const publicPath = getPublicPath({
          config,
          isProd,
          context: api.context,
        });

        // js output
        const jsPath = config.output.distPath.js;
        const jsAsyncPath = getJsAsyncPath(
          jsPath,
          isServer,
          config.output.distPath.jsAsync,
        );
        const jsFilename = getFilename(config, 'js', isProd, isServer);
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
          chain.output.library({
            type: 'commonjs2',
            ...(chain.output.get('library') || {}),
          });
        }

        if (config.output.copy && api.context.bundlerType === 'rspack') {
          const { copy } = config.output;
          const options = Array.isArray(copy) ? { patterns: copy } : copy;

          chain
            .plugin(CHAIN_ID.PLUGIN.COPY)
            .use(rspack.CopyRspackPlugin, [options]);
        }
      },
    );
  },
});
