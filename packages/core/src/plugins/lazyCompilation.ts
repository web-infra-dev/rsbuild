import { isURL } from '../helpers/url';
import { getHostInUrl } from '../server/helper';
import { replacePortPlaceholder } from '../server/open';
import type {
  LazyCompilationOptions,
  NormalizedEnvironmentConfig,
  Rspack,
  RsbuildContext,
  RsbuildPlugin,
} from '../types';

export const isNodeLazyCompilationEnabled = (
  options: NormalizedEnvironmentConfig['dev']['lazyCompilation'],
): options is LazyCompilationOptions & { node: true } =>
  typeof options === 'object' && options.node === true;

const getRspackOptions = (
  options: LazyCompilationOptions,
): Rspack.LazyCompilationOptions => {
  const { node: _node, ...rspackOptions } = options;
  return rspackOptions;
};

const getServerUrlFromClientConfig = async (
  config: NormalizedEnvironmentConfig,
  context: RsbuildContext,
): Promise<string | undefined> => {
  const { assetPrefix } = config.dev;
  const hasAbsoluteAssetPrefix =
    assetPrefix === true ||
    (typeof assetPrefix === 'string' && isURL(assetPrefix));

  // A relative asset prefix indicates that page requests are routed through the
  // current origin, so the lazy compilation endpoint should follow the same route.
  if (!hasAbsoluteAssetPrefix) {
    return;
  }

  const { devServer } = context;
  if (!devServer) {
    return;
  }

  const { client } = config.dev;
  const hasClientHost = Boolean(client.host);
  const hasClientPort = client.port !== undefined && client.port !== '';

  if (!hasClientHost && !hasClientPort) {
    return;
  }

  const protocol = client.protocol
    ? `${client.protocol === 'wss' ? 'https' : 'http'}:`
    : '';
  const hostname = await getHostInUrl(client.host || devServer.hostname);
  const port =
    client.port && client.port !== '<port>' ? client.port : devServer.port;

  return `${protocol}//${hostname}:${port}`;
};

const getNodeServerUrl = async (
  options: Rspack.LazyCompilationOptions,
  context: RsbuildContext,
): Promise<string | undefined> => {
  if (typeof options.serverUrl === 'string') {
    const validationUrl = replacePortPlaceholder(
      options.serverUrl,
      context.devServer?.port ?? 0,
    );
    if (!/^https?:\/\//i.test(validationUrl) || !URL.canParse(validationUrl)) {
      throw new Error(
        'Node lazy compilation requires dev.lazyCompilation.serverUrl to be an absolute HTTP(S) URL.',
      );
    }
    const serverUrl = context.devServer
      ? replacePortPlaceholder(options.serverUrl, context.devServer.port)
      : options.serverUrl;
    return serverUrl.replace(/^https?/i, (protocol) => protocol.toLowerCase());
  }

  if (!context.devServer) {
    return;
  }

  const protocol = context.devServer.https ? 'https' : 'http';
  const hostname = await getHostInUrl(context.devServer.hostname);
  return `${protocol}://${hostname}:${context.devServer.port}`;
};

export const pluginLazyCompilation = (): RsbuildPlugin => ({
  name: 'rsbuild:lazy-compilation',

  apply: 'serve',

  setup(api) {
    api.modifyBundlerChain(async (chain, { environment, target }) => {
      const { config } = environment;
      const options = config.dev.lazyCompilation;
      if (!options || target === 'web-worker') {
        return;
      }

      if (target === 'node') {
        if (!isNodeLazyCompilationEnabled(options)) {
          return;
        }
        if (!config.dev.hmr) {
          throw new Error(
            'Node lazy compilation requires dev.hmr to apply compiled modules to the retained runtime.',
          );
        }

        const rspackOptions = getRspackOptions(options);
        if (rspackOptions.entries === true) {
          throw new Error(
            'Node lazy compilation does not support dev.lazyCompilation.entries: true. Keep the entry eager so it can own the retained runtime.',
          );
        }

        const serverUrl = await getNodeServerUrl(rspackOptions, api.context);
        chain.lazyCompilation({
          ...rspackOptions,
          entries: false,
          ...(serverUrl ? { serverUrl } : {}),
        });
        return;
      }

      if (target !== 'web') {
        return;
      }

      if (!config.dev.hmr && !config.dev.liveReload) {
        return;
      }

      if (options === true) {
        const entries = chain.entryPoints.entries() || {};
        const serverUrl = await getServerUrlFromClientConfig(
          config,
          api.context,
        );

        // If there is only one entry, do not enable lazy compilation for entries
        // this can reduce the rebuild time
        if (Object.keys(entries).length <= 1) {
          chain.lazyCompilation({
            entries: false,
            imports: true,
            ...(serverUrl ? { serverUrl } : {}),
          });
          return;
        }

        if (serverUrl) {
          chain.lazyCompilation({
            entries: true,
            imports: true,
            serverUrl,
          });
          return;
        }
      }

      // replace port placeholder in `serverUrl` with actual port
      if (
        typeof options === 'object' &&
        typeof options.serverUrl === 'string' &&
        api.context.devServer
      ) {
        const rspackOptions = getRspackOptions(options);
        chain.lazyCompilation({
          ...rspackOptions,
          serverUrl: replacePortPlaceholder(
            options.serverUrl,
            api.context.devServer.port,
          ),
        });
        return;
      }

      if (typeof options === 'object') {
        const rspackOptions = getRspackOptions(options);
        const serverUrl = await getServerUrlFromClientConfig(
          config,
          api.context,
        );
        chain.lazyCompilation(
          serverUrl ? { ...rspackOptions, serverUrl } : rspackOptions,
        );
        return;
      }

      chain.lazyCompilation(options);
    });
  },
});
