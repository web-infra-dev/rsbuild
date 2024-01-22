import type { RsbuildPlugin } from '@rsbuild/core';
import * as nodeLibs from './libs';

const getResolveFallback = (protocolImports?: boolean) => {
  const fallback: Record<string, string | false> = {};

  Object.keys(nodeLibs).forEach((name) => {
    const libPath = nodeLibs[name as keyof typeof nodeLibs];

    fallback[name] = libPath ?? false;

    if (protocolImports) {
      fallback[`node:${name}`] = fallback[name];
    }
  });

  return fallback;
};

const getProvideLibs = async () => {
  return {
    Buffer: [nodeLibs.buffer, 'Buffer'],
    process: [nodeLibs.process],
  };
};

export type PluginNodePolyfillOptions = {
  /**
   * Whether to polyfill Node.js builtin modules starting with `node:`.
   * @see https://nodejs.org/api/esm.html#node-imports
   * @default true
   */
  protocolImports?: boolean;
};

export function pluginNodePolyfill(
  options: PluginNodePolyfillOptions = {},
): RsbuildPlugin {
  const { protocolImports = true } = options;

  return {
    name: 'rsbuild:node-polyfill',

    setup(api) {
      api.modifyBundlerChain(async (chain, { CHAIN_ID, isServer, bundler }) => {
        // it had not need `node polyfill`, if the target is 'node'(server runtime).
        if (isServer) {
          return;
        }

        // module polyfill
        chain.resolve.fallback.merge(getResolveFallback(protocolImports));

        chain
          .plugin(CHAIN_ID.PLUGIN.NODE_POLYFILL_PROVIDE)
          .use(bundler.ProvidePlugin, [await getProvideLibs()]);
      });
    },
  };
}
