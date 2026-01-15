import { posix } from 'node:path';
import {
  ALL_INTERFACES_IPV4,
  DEFAULT_ASSET_PREFIX,
  DEFAULT_PORT,
  LOCALHOST,
} from '../constants';
import { getFilename } from '../helpers';
import { formatPublicPath, urlJoin } from '../helpers/url';
import { replacePortPlaceholder } from '../server/open';
import type {
  NormalizedEnvironmentConfig,
  RsbuildContext,
  RsbuildPlugin,
} from '../types';

function getPublicPath({
  isDev,
  isServer,
  config,
  context,
}: {
  isDev: boolean;
  isServer: boolean;
  config: NormalizedEnvironmentConfig;
  context: RsbuildContext;
}) {
  const { dev, output, server } = config;

  // For server targets (node), use empty string or explicit assetPrefix to enable relative paths
  // This is important for worker_threads and other node-specific imports
  // See: https://github.com/web-infra-dev/rsbuild/issues/6539
  if (isServer) {
    if (!isDev && typeof output.assetPrefix === 'string') {
      return output.assetPrefix;
    }
    // For node targets in dev mode, use empty string by default
    return '';
  }

  let publicPath = DEFAULT_ASSET_PREFIX;

  // If `mode` is `production` or `none`, use `output.assetPrefix`
  if (!isDev) {
    if (typeof output.assetPrefix === 'string') {
      publicPath = output.assetPrefix;
    }
  } else if (
    typeof output.assetPrefix === 'string' &&
    output.assetPrefix !== DEFAULT_ASSET_PREFIX
  ) {
    // In dev mode, prefer environment-specific `output.assetPrefix` over `dev.assetPrefix`
    // but only if it's explicitly set to a non-default value
    publicPath = output.assetPrefix;
  } else if (typeof dev.assetPrefix === 'string') {
    publicPath = dev.assetPrefix;
  } else if (dev.assetPrefix) {
    const protocol = context.devServer?.https ? 'https' : 'http';
    const hostname = context.devServer?.hostname || LOCALHOST;

    if (hostname === ALL_INTERFACES_IPV4) {
      // http://0.0.0.0:port can't visit on Windows, so we shouldn't set publicPath as `//0.0.0.0:${port}/`;
      // Relative to docs:
      // - https://github.com/quarkusio/quarkus/issues/12246
      publicPath = `${protocol}://localhost:<port>/`;
    } else {
      publicPath = `${protocol}://${hostname}:<port>/`;
    }

    if (server.base && server.base !== '/') {
      publicPath = urlJoin(publicPath, server.base);
    }
  }

  const defaultPort = server.port ?? DEFAULT_PORT;
  const port = isDev ? (context.devServer?.port ?? defaultPort) : defaultPort;
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
      (chain, { CHAIN_ID, isDev, isProd, isServer, environment, rspack }) => {
        const { distPath, config } = environment;

        const publicPath = getPublicPath({
          config,
          isDev,
          isServer,
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
          .publicPath(publicPath);

        if (isServer) {
          chain.output.library({
            type: 'commonjs2',
            ...(chain.output.get('library') || {}),
          });
        }

        if (config.output.copy) {
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
