import {
  isProd,
  isUsingHMR,
  isClientCompiler,
  type ReactConfig,
} from '@rsbuild/shared';
import type { Rspack, RsbuildPluginAPI } from '@rsbuild/core';
import type { PluginReactOptions } from '.';

function getReactRefreshEntry(compiler: Rspack.Compiler) {
  const hot = compiler.options.devServer?.hot ?? true;
  const refresh = compiler.options.builtins?.react?.refresh ?? true;

  if (hot && refresh) {
    const reactRefreshEntryPath = require.resolve(
      '@rspack/plugin-react-refresh/react-refresh-entry',
    );
    return reactRefreshEntryPath;
  }

  return null;
}

const setupCompiler = (compiler: Rspack.Compiler) => {
  if (!isClientCompiler(compiler)) {
    return;
  }

  const reactRefreshEntry = getReactRefreshEntry(compiler);
  if (!reactRefreshEntry) {
    return;
  }

  new compiler.webpack.EntryPlugin(compiler.context, reactRefreshEntry, {
    name: undefined,
  }).apply(compiler);
};

export const applyBasicReactSupport = (
  api: RsbuildPluginAPI,
  options: PluginReactOptions,
) => {
  api.onAfterCreateCompiler(({ compiler: multiCompiler }) => {
    if (isProd()) {
      return;
    }

    if ((multiCompiler as Rspack.MultiCompiler).compilers) {
      (multiCompiler as Rspack.MultiCompiler).compilers.forEach(setupCompiler);
    } else {
      setupCompiler(multiCompiler as Rspack.Compiler);
    }
  });

  api.modifyBundlerChain(async (chain, { CHAIN_ID, isProd, target }) => {
    const config = api.getNormalizedConfig();
    const usingHMR = isUsingHMR(config, { isProd, target });
    const rule = chain.module.rule(CHAIN_ID.RULE.JS);

    const reactOptions: ReactConfig = {
      development: !isProd,
      refresh: usingHMR,
      runtime: options.jsxRuntime ?? 'automatic',
    };

    if (options.jsxImportSource) {
      reactOptions.importSource = options.jsxImportSource;
    }

    rule.use(CHAIN_ID.USE.SWC).tap((options) => {
      options.jsc.transform.react = {
        ...reactOptions,
      };
      return options;
    });

    if (chain.module.rules.has(CHAIN_ID.RULE.JS_DATA_URI)) {
      chain.module
        .rule(CHAIN_ID.RULE.JS_DATA_URI)
        .use(CHAIN_ID.USE.SWC)
        .tap((options) => {
          options.jsc.transform.react = {
            ...reactOptions,
          };
          return options;
        });
    }

    if (!usingHMR) {
      return;
    }

    const { default: ReactRefreshRspackPlugin } = await import(
      '@rspack/plugin-react-refresh'
    );

    chain
      .plugin(CHAIN_ID.PLUGIN.REACT_FAST_REFRESH)
      .use(ReactRefreshRspackPlugin);
  });
};
