import { setConfig } from '@rsbuild/shared';
import type { RsbuildPlugin } from '@rsbuild/core';
import type { RsbuildPluginAPI as WebpackRsbuildPluginAPI } from '@rsbuild/webpack';
import type { RsbuildPluginAPI as RspackRsbuildPluginAPI } from '@rsbuild/core';

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
 *   rsbuild.addPlugins([ pluginNodePolyfill() ]);
 */
export function pluginNodePolyfill(): RsbuildPlugin<
  WebpackRsbuildPluginAPI | RspackRsbuildPluginAPI
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
        (api as RspackRsbuildPluginAPI).modifyRspackConfig(
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
        (api as WebpackRsbuildPluginAPI).modifyWebpackChain(
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
