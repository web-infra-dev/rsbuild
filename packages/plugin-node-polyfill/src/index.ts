import type { RsbuildPlugin } from '@rsbuild/core';
import * as nodeLibs from './libs';

type Globals = {
  process?: boolean;
  Buffer?: boolean;
};

export type PluginNodePolyfillOptions = {
  /**
   * Whether to provide polyfill of globals.
   * @default
   * {
   *   Buffer: true,
   *   process: true,
   * }
   */
  globals?: Globals;
};

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

const getProvideGlobals = async (globals?: Globals) => {
  const result: Record<string, string | string[]> = {};

  if (globals?.Buffer !== false) {
    result.Buffer = [nodeLibs.buffer, 'Buffer'];
  }
  if (globals?.process !== false) {
    result.process = [nodeLibs.process];
  }

  return result;
};

export function pluginNodePolyfill(
  options: PluginNodePolyfillOptions = {},
): RsbuildPlugin {
  return {
    name: 'rsbuild:node-polyfill',

    setup(api) {
      api.modifyBundlerChain(async (chain, { CHAIN_ID, isServer, bundler }) => {
        // The server bundle does not require node polyfill
        if (isServer) {
          return;
        }

        // module polyfill
        chain.resolve.fallback.merge(getResolveFallback(nodeLibs));

        const provideGlobals = await getProvideGlobals(options.globals);
        if (Object.keys(provideGlobals).length) {
          chain
            .plugin(CHAIN_ID.PLUGIN.NODE_POLYFILL_PROVIDE)
            .use(bundler.ProvidePlugin, [provideGlobals]);
        }
      });
    },
  };
}
