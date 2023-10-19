import { setConfig } from '@rsbuild/shared';
import type { BuilderPlugin } from '@rsbuild/core';
import type { BuilderPluginAPI as WebpackBuilderPluginAPI } from '@rsbuild/webpack';
import type { BuilderPluginAPI as RspackBuilderPluginAPI } from '@rsbuild/core';

const getResolveFallback = (nodeLibs: Record<string, any>) =>
  Object.keys(nodeLibs).reduce<Record<string, string | false>>(
    (previous, name) => {
      if (nodeLibs[name]) {
        previous[name] = nodeLibs[name];
      } else {
        previous[name] = false;
      }
      return previous;
    },
    {},
  );

const getProvideLibs = async () => {
  const { default: nodeLibs } = await import(
    // @ts-expect-error
    'node-libs-browser'
  );
  return {
    Buffer: [nodeLibs.buffer, 'Buffer'],
    process: [nodeLibs.process],
  };
};

/**
 * Usage:
 *
 *   const { pluginNodePolyfill } = await import('@rsbuild/plugin-node-polyfill');
 *
 *   builder.addPlugins([ pluginNodePolyfill() ]);
 */
export function pluginNodePolyfill(): BuilderPlugin<
  WebpackBuilderPluginAPI | RspackBuilderPluginAPI
> {
  return {
    name: 'plugin-node-polyfill',

    async setup(api) {
      api.modifyBundlerChain(async (chain, { isServer }) => {
        // it had not need `node polyfill`, if the target is 'node'(server runtime).
        if (isServer) {
          return;
        }

        const { default: nodeLibs } = await import(
          // @ts-expect-error
          'node-libs-browser'
        );

        // module polyfill
        chain.resolve.fallback.merge(getResolveFallback(nodeLibs));
      });

      if (api.context.bundlerType === 'rspack') {
        (api as RspackBuilderPluginAPI).modifyRspackConfig(
          async (config, { isServer }) => {
            if (isServer) {
              return;
            }
            setConfig(config, 'builtins.provide', {
              ...(config.builtins?.provide ?? {}),
              ...(await getProvideLibs()),
            });
          },
        );
      } else {
        (api as WebpackBuilderPluginAPI).modifyWebpackChain(
          async (chain, { CHAIN_ID, isServer, webpack }) => {
            if (isServer) {
              return;
            }
            chain
              .plugin(CHAIN_ID.PLUGIN.NODE_POLYFILL_PROVIDE)
              .use(webpack.ProvidePlugin, [await getProvideLibs()]);
          },
        );
      }
    },
  };
}
