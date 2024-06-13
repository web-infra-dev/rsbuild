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

  /**
   * Whether to polyfill Node.js builtin modules starting with `node:`.
   * @see https://nodejs.org/api/esm.html#node-imports
   * @default true
   */
  protocolImports?: boolean;
};

const getResolveFallback = (protocolImports?: boolean) => {
  const fallback: Record<string, string | false> = {};

  for (const name of Object.keys(nodeLibs)) {
    const libPath = nodeLibs[name as keyof typeof nodeLibs];

    fallback[name] = libPath ?? false;

    if (protocolImports) {
      fallback[`node:${name}`] = fallback[name];
    }
  }

  return fallback;
};

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

export const PLUGIN_NODE_POLYFILL_NAME = 'rsbuild:node-polyfill';

export function pluginNodePolyfill(
  options: PluginNodePolyfillOptions = {},
): RsbuildPlugin {
  const { protocolImports = true } = options;

  return {
    name: PLUGIN_NODE_POLYFILL_NAME,

    setup(api) {
      api.modifyBundlerChain(async (chain, { CHAIN_ID, isServer, bundler }) => {
        // The server bundle does not require node polyfill
        if (isServer) {
          return;
        }

        // module polyfill
        chain.resolve.fallback.merge(getResolveFallback(protocolImports));

        const provideGlobals = await getProvideGlobals(options.globals);
        if (Object.keys(provideGlobals).length) {
          chain
            .plugin(CHAIN_ID.PLUGIN.NODE_POLYFILL_PROVIDE)
            .use(bundler.ProvidePlugin, [provideGlobals]);
        }

        if (protocolImports) {
          const { ProtocolImportsPlugin } = await import(
            './ProtocolImportsPlugin'
          );
          chain.plugin('protocol-imports').use(ProtocolImportsPlugin);
        }
      });
    },
  };
}
