import { createRequire } from 'node:module';
import path from 'node:path';
import {
  rspack,
  type RsbuildConfig,
  type RsbuildPlugin,
  type RsbuildPluginAPI,
  type Rspack,
} from '@rsbuild/core';
import type { PluginOptions as ReactRefreshOptions } from '@rspack/plugin-react-refresh';
import { applySplitChunksRule } from './splitChunks.js';

const require = createRequire(import.meta.url);

export type SplitReactChunkOptions = {
  /**
   * Whether to enable split chunking for React-related dependencies (e.g., react, react-dom, scheduler).
   *
   * @default true
   */
  react?: boolean;
  /**
   * Whether to enable split chunking for routing-related dependencies (e.g., react-router, react-router-dom, history).
   *
   * @default true
   */
  router?: boolean;
};

export type ReactCompilerOptions = Exclude<
  NonNullable<Rspack.SwcLoaderTransformConfig['reactCompiler']>,
  boolean
>;

export type ReactCompilerFilter = {
  /**
   * Only compile matching modules with React Compiler. Accepts any Rspack rule condition,
   * such as a path prefix, a RegExp, a function, or an array of them.
   */
  include?: Rspack.RuleSetCondition;
  /**
   * Skip React Compiler for matching modules. Takes precedence over `include`.
   */
  exclude?: Rspack.RuleSetCondition;
};

export type ReactCompilerConfig =
  boolean | (ReactCompilerOptions & ReactCompilerFilter);

export type PluginReactOptions = {
  /**
   * Configure the behavior of SWC to transform React code,
   * the same as SWC's [jsc.transform.react](https://swc.rs/docs/configuration/compilation#jsctransformreact).
   */
  swcReactOptions?: Rspack.SwcLoaderTransformConfig['react'];
  /**
   * Enable or configure React Compiler via `builtin:swc-loader`,
   * the same as Rspack's `jsc.transform.reactCompiler` option.
   * Only applied to environments whose `output.target` is `web`.
   * Use `include` and `exclude` to compile only part of the codebase, for example to adopt
   * React Compiler gradually or to skip files that are not compatible with it yet.
   *
   * @see https://rspack.rs/guide/integrations/react#using-builtinswc-loader
   */
  reactCompiler?: ReactCompilerConfig;
  /**
   * Configuration for chunk splitting of React-related dependencies when `chunkSplit.strategy`
   * is set to `split-by-experience`.
   * @default true
   */
  splitChunks?: boolean | SplitReactChunkOptions;
  /**
   * When set to `true`, enables the React Profiler for performance analysis in production builds.
   * @default false
   */
  enableProfiler?: boolean;
  /**
   * Options passed to `@rspack/plugin-react-refresh`
   * @default
   * {
   *   include: [/\.(?:js|jsx|mjs|cjs|ts|tsx|mts|cts)$/],
   *   exclude: [/[\\/]node_modules[\\/]/],
   *   resourceQuery: { not: /^\?raw$/ },
   * }
   * @see https://rspack.rs/guide/integrations/react#fast-refresh
   */
  reactRefreshOptions?: ReactRefreshOptions;
  /**
   * Whether to enable React Fast Refresh in development mode.
   * @default true
   */
  fastRefresh?: boolean;
};

export const PLUGIN_REACT_NAME = 'rsbuild:react';

function assertCoreVersion(version: string): void {
  if (version.split('.')[0] === '1') {
    throw new Error(
      `"@rsbuild/plugin-react" v2 requires "@rsbuild/core" >= 2.0. Please upgrade "@rsbuild/core" or use "@rsbuild/plugin-react" v1.`,
    );
  }
}

function assertReactCompilerVersion(): void {
  const [majorVersion, minorVersion] = rspack.rspackVersion.split('.');
  const major = Number(majorVersion);
  const minor = Number(minorVersion);

  if (major < 2 || (major === 2 && minor < 1)) {
    throw new Error(
      `"@rsbuild/plugin-react" requires "@rspack/core" >= 2.1.0 to use the "reactCompiler" option, but found ${rspack.rspackVersion}.`,
    );
  }
}

const REACT_COMPILER_ONE_OF = 'js-react-compiler';

function splitReactCompilerConfig(config: ReactCompilerConfig): {
  compilerOptions: Rspack.SwcLoaderTransformConfig['reactCompiler'];
  filter?: ReactCompilerFilter;
} {
  if (typeof config !== 'object' || config === null) {
    return { compilerOptions: config };
  }
  const { include, exclude, ...compilerOptions } = config;
  if (include === undefined && exclude === undefined) {
    return { compilerOptions: config };
  }
  return {
    compilerOptions: Object.keys(compilerOptions).length
      ? compilerOptions
      : true,
    filter: { include, exclude },
  };
}

/**
 * Compile only the modules selected by `include` and `exclude` with React Compiler.
 *
 * The JS rule picks the first matching `oneOf` branch, so a copy of the main branch with
 * React Compiler enabled is inserted before it. Selected modules go through the copy and
 * every other module keeps the main branch, with the same loaders and options otherwise.
 */
function applyReactCompilerFilter(
  api: RsbuildPluginAPI,
  compilerOptions: Rspack.SwcLoaderTransformConfig['reactCompiler'],
  filter: ReactCompilerFilter,
): void {
  api.modifyBundlerChain({
    order: 'post',
    handler: (chain, { CHAIN_ID, target }) => {
      // React Compiler memoizes re-renders, which only happen in the browser.
      if (target !== 'web') {
        return;
      }

      const jsRule = chain.module.rule(CHAIN_ID.RULE.JS);
      if (!jsRule.oneOfs.has(CHAIN_ID.ONE_OF.JS_MAIN)) {
        return;
      }
      const mainRule = jsRule.oneOf(CHAIN_ID.ONE_OF.JS_MAIN);
      if (!mainRule.uses.has(CHAIN_ID.USE.SWC)) {
        return;
      }

      const compilerRule = jsRule
        .oneOf(REACT_COMPILER_ONE_OF)
        .before(CHAIN_ID.ONE_OF.JS_MAIN);
      // `entries()` is undefined for an empty map.
      compilerRule
        .merge(
          (mainRule.entries() ?? {}) as Parameters<
            typeof compilerRule.merge
          >[0],
        )
        .include.merge(mainRule.include.values())
        .end()
        .exclude.merge(mainRule.exclude.values());
      compilerRule.resolve
        .merge(
          (mainRule.resolve.entries() ?? {}) as Parameters<
            typeof compilerRule.resolve.merge
          >[0],
        )
        .alias.merge(mainRule.resolve.alias.entries() ?? {});
      // Merging deep-copies loader options, so the two branches don't share them.
      for (const name of Object.keys(mainRule.uses.entries() ?? {})) {
        const use = compilerRule.use(name);
        use.merge(
          mainRule.use(name).entries() as Parameters<typeof use.merge>[0],
        );
      }

      if (filter.include !== undefined) {
        compilerRule.include.add(filter.include);
      }
      if (filter.exclude !== undefined) {
        compilerRule.exclude.add(filter.exclude);
      }

      compilerRule.use(CHAIN_ID.USE.SWC).tap((options) => {
        const swcOptions = options as Rspack.SwcLoaderOptions;
        return {
          ...swcOptions,
          jsc: {
            ...swcOptions.jsc,
            transform: {
              ...swcOptions.jsc?.transform,
              reactCompiler: compilerOptions,
            },
          },
        };
      });
    },
  });
}

function applyReactProfiler(api: RsbuildPluginAPI): void {
  api.modifyEnvironmentConfig((config, { mergeEnvironmentConfig }) => {
    if (config.mode !== 'production') {
      return;
    }

    const enableProfilerConfig: RsbuildConfig = {
      output: {
        minify: {
          jsOptions: {
            minimizerOptions: {
              // Need to keep classnames and function names like Components for debugging purposes.
              mangle: {
                keep_classnames: true,
                keep_fnames: true,
              },
            },
          },
        },
      },
    };
    return mergeEnvironmentConfig(config, enableProfilerConfig);
  });

  // react-dom/client was introduced in React 18
  let hasReactDomClientCache: boolean | undefined;
  const hasReactDomClient = () => {
    if (hasReactDomClientCache !== undefined) {
      return hasReactDomClientCache;
    }

    try {
      require.resolve('react-dom/client', {
        paths: [api.context.rootPath],
      });
      hasReactDomClientCache = true;
    } catch {
      hasReactDomClientCache = false;
    }

    return hasReactDomClientCache;
  };

  api.modifyBundlerChain((chain, { isProd }) => {
    if (!isProd) {
      return;
    }

    // Replace react-dom with the profiling version.
    // For React 18+, we need to replace `react-dom/client` with `react-dom/profiling`.
    // Reference: https://gist.github.com/bvaughn/25e6233aeb1b4f0cdb8d8366e54a3977
    chain.resolve.alias.set(
      hasReactDomClient() ? 'react-dom/client$' : 'react-dom$',
      'react-dom/profiling',
    );
    chain.resolve.alias.set('scheduler/tracing', 'scheduler/tracing-profiling');
  });
}

export const pluginReact = (
  options: PluginReactOptions = {},
): RsbuildPlugin => ({
  name: PLUGIN_REACT_NAME,

  setup(api) {
    assertCoreVersion(api.context.version);

    const defaultOptions = {
      fastRefresh: true,
      splitChunks: true,
      enableProfiler: false,
    } satisfies PluginReactOptions;

    const finalOptions = {
      ...defaultOptions,
      ...options,
    };

    if (finalOptions.reactCompiler !== undefined) {
      assertReactCompilerVersion();
    }

    const { compilerOptions, filter } =
      finalOptions.reactCompiler === undefined
        ? { compilerOptions: undefined, filter: undefined }
        : splitReactCompilerConfig(finalOptions.reactCompiler);

    const reactRefreshPath = finalOptions.fastRefresh
      ? require.resolve('react-refresh')
      : '';

    api.modifyEnvironmentConfig((config, { mergeEnvironmentConfig }) => {
      const isDev = config.mode === 'development';
      const usingHMR =
        isDev && config.dev.hmr && config.output.target === 'web';

      const reactOptions: Rspack.SwcLoaderTransformConfig['react'] = {
        development: isDev,
        refresh: usingHMR && finalOptions.fastRefresh,
        runtime: 'automatic',
        ...finalOptions.swcReactOptions,
      };
      const transformOptions: Rspack.SwcLoaderTransformConfig = {
        react: reactOptions,
      };

      // React Compiler memoizes re-renders, which only happen in the browser.
      // With a filter, it is enabled per module in `applyReactCompilerFilter` instead.
      if (
        compilerOptions !== undefined &&
        !filter &&
        config.output.target === 'web'
      ) {
        transformOptions.reactCompiler = compilerOptions;
      }

      return mergeEnvironmentConfig(
        {
          tools: {
            swc: {
              jsc: {
                transform: transformOptions,
              },
            },
          },
        },
        config,
      );
    });

    if (finalOptions.swcReactOptions?.runtime === 'preserve') {
      api.modifyBundlerChain((chain) => {
        chain.module.parser.merge({
          javascript: {
            jsx: true,
          },
        });
      });
    }

    api.modifyBundlerChain(
      async (chain, { CHAIN_ID, environment, isDev, target }) => {
        const { config } = environment;
        const usingHMR = isDev && config.dev.hmr && target === 'web';
        if (!usingHMR || !finalOptions.fastRefresh) {
          return;
        }

        chain.resolve.alias.set(
          'react-refresh',
          path.dirname(reactRefreshPath),
        );

        const { ReactRefreshRspackPlugin } =
          await import('@rspack/plugin-react-refresh');

        const jsRule = chain.module.rules.get(CHAIN_ID.RULE.JS);

        chain
          .plugin(CHAIN_ID.PLUGIN.REACT_FAST_REFRESH)
          .use(ReactRefreshRspackPlugin, [
            {
              test: jsRule.get('test'),
              include: jsRule.include.values(),
              exclude: jsRule.exclude.values(),
              resourceQuery: { not: /^\?raw$/ },
              ...finalOptions.reactRefreshOptions,
            },
          ]);
      },
    );

    if (filter) {
      applyReactCompilerFilter(api, compilerOptions, filter);
    }

    applySplitChunksRule(api, finalOptions.splitChunks);

    if (finalOptions.enableProfiler) {
      applyReactProfiler(api);
    }
  },
});
