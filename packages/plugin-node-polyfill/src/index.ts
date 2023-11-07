import type { RsbuildPlugin, RsbuildPluginAPI } from '@rsbuild/core';

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
export function pluginNodePolyfill(): RsbuildPlugin<RsbuildPluginAPI> {
  return {
    name: 'plugin-node-polyfill',

    setup(api) {
      api.modifyBundlerChain(async (chain, { CHAIN_ID, isServer, bundler }) => {
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

        chain
          .plugin(CHAIN_ID.PLUGIN.NODE_POLYFILL_PROVIDE)
          .use(bundler.ProvidePlugin, [await getProvideLibs()]);
      });
    },
  };
}
