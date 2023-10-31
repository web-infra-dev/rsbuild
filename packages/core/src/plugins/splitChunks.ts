import assert from 'assert';
import {
  NODE_MODULES_REGEX,
  RUNTIME_CHUNK_NAME,
  getPackageNameFromModulePath,
  type Polyfill,
  type CacheGroup,
  type SplitChunks,
  type ForceSplitting,
  type RsbuildChunkSplit,
  type DefaultRsbuildPlugin,
} from '@rsbuild/shared';

// We expose the three-layer to specify webpack chunk-split ability:
// 1. By strategy.There some best practice integrated in our internal strategy.
// 2. By forceSplitting config, which is designed to split chunks by user defined rules.That's easier to use than webpack raw config.
// 3. By override config, which is designed to override the raw config of webpack `splitChunks`.It has the highest priority.
// By the way, the config complexity is increasing gradually.

interface SplitChunksContext {
  /**
   * User defined cache groups which can be reused across different split strategies
   */
  userDefinedCacheGroups: CacheGroup;
  /**
   * Default split config in webpack
   */
  defaultConfig: SplitChunks;
  /**
   * User webpack `splitChunks` config
   */
  override: SplitChunks;
  /**
   * User Rsbuild `chunkSplit` config
   */
  rsbuildConfig: RsbuildChunkSplit;
  /**
   * The root path of current project
   */
  rootPath: string;
  /**
   * The polyfill mode.
   */
  polyfill: Polyfill;
}

function getUserDefinedCacheGroups(forceSplitting: ForceSplitting): CacheGroup {
  const cacheGroups: CacheGroup = {};
  const pairs = Array.isArray(forceSplitting)
    ? forceSplitting.map(
        (regexp, index) => [`force-split-${index}`, regexp] as const,
      )
    : Object.entries(forceSplitting);

  pairs.forEach(([key, regexp]) => {
    cacheGroups[key] = {
      test: regexp,
      name: key,
      chunks: 'all',
      // Ignore minimum size, minimum chunks and maximum requests and always create chunks for user defined cache group.
      enforce: true,
    };
  });

  return cacheGroups;
}

const DEPENDENCY_MATCH_TEMPL = /[\\/]node_modules[\\/](<SOURCES>)[\\/]/.source;

/** Expect to match path just like "./node_modules/react-router/" */
export const createDependenciesRegExp = (
  ...dependencies: (string | RegExp)[]
) => {
  const sources = dependencies.map((d) =>
    typeof d === 'string' ? d : d.source,
  );
  const expr = DEPENDENCY_MATCH_TEMPL.replace('<SOURCES>', sources.join('|'));
  return new RegExp(expr);
};

function splitByExperience(ctx: SplitChunksContext): SplitChunks {
  const { override, polyfill, defaultConfig, userDefinedCacheGroups } = ctx;
  const experienceCacheGroup: CacheGroup = {};

  const packageRegExps: Record<string, RegExp> = {
    lodash: createDependenciesRegExp('lodash', 'lodash-es'),
    axios: createDependenciesRegExp('axios', /axios-.+/),
  };

  if (polyfill === 'entry' || polyfill === 'usage') {
    packageRegExps.polyfill = createDependenciesRegExp(
      'tslib',
      'core-js',
      '@babel/runtime',
      '@swc/helpers',
    );
  }

  Object.entries(packageRegExps).forEach(([name, test]) => {
    const key = `lib-${name}`;

    experienceCacheGroup[key] = {
      test,
      priority: 0,
      name: key,
      reuseExistingChunk: true,
    };
  });

  assert(defaultConfig !== false);
  assert(override !== false);

  return {
    ...defaultConfig,
    ...override,
    cacheGroups: {
      ...defaultConfig.cacheGroups,
      ...experienceCacheGroup,
      ...userDefinedCacheGroups,
      ...override.cacheGroups,
    },
  };
}

function splitByModule(ctx: SplitChunksContext): SplitChunks {
  const { override, userDefinedCacheGroups, defaultConfig } = ctx;
  assert(defaultConfig !== false);
  assert(override !== false);
  return {
    ...defaultConfig,
    minSize: 0,
    maxInitialRequests: Infinity,
    ...override,
    cacheGroups: {
      ...defaultConfig.cacheGroups,
      ...userDefinedCacheGroups,
      // Core group
      vendors: {
        priority: -10,
        test: NODE_MODULES_REGEX,
        // todo: not support in rspack
        name(module: { context: string | null }): string | false {
          return getPackageNameFromModulePath(module.context!);
        },
      },
      ...override.cacheGroups,
    },
  };
}

function splitBySize(ctx: SplitChunksContext): SplitChunks {
  const { override, userDefinedCacheGroups, defaultConfig, rsbuildConfig } =
    ctx;
  assert(defaultConfig !== false);
  assert(override !== false);
  assert(rsbuildConfig.strategy === 'split-by-size');
  return {
    ...defaultConfig,
    minSize: rsbuildConfig.minSize ?? 0,
    maxSize: rsbuildConfig.maxSize ?? Infinity,
    ...override,
    cacheGroups: {
      ...defaultConfig.cacheGroups,
      ...userDefinedCacheGroups,
      ...override.cacheGroups,
    },
  };
}

function splitCustom(ctx: SplitChunksContext): SplitChunks {
  const { override, userDefinedCacheGroups, defaultConfig } = ctx;
  assert(defaultConfig !== false);
  assert(override !== false);
  return {
    ...defaultConfig,
    ...override,
    cacheGroups: {
      ...defaultConfig.cacheGroups,
      ...userDefinedCacheGroups,
      ...override.cacheGroups,
    },
  };
}

function allInOne(_ctx: SplitChunksContext): SplitChunks {
  // Set false to avoid chunk split.
  return false;
}

// Ignore user defined cache group to get single vendor chunk.
function singleVendor(ctx: SplitChunksContext): SplitChunks {
  const { override, defaultConfig, userDefinedCacheGroups } = ctx;
  assert(defaultConfig !== false);
  assert(override !== false);

  const singleVendorCacheGroup: CacheGroup = {
    singleVendor: {
      test: NODE_MODULES_REGEX,
      priority: 0,
      chunks: 'all',
      name: 'vendor',
      enforce: true,
      reuseExistingChunk: true,
    },
  };

  return {
    ...defaultConfig,
    ...override,
    cacheGroups: {
      ...defaultConfig.cacheGroups,
      ...singleVendorCacheGroup,
      ...userDefinedCacheGroups,
      ...override.cacheGroups,
    },
  };
}

const SPLIT_STRATEGY_DISPATCHER: Record<
  string,
  (ctx: SplitChunksContext) => SplitChunks | Promise<SplitChunks>
> = {
  'split-by-experience': splitByExperience,
  'split-by-module': splitByModule,
  'split-by-size': splitBySize,
  custom: splitCustom,
  'all-in-one': allInOne,
  'single-vendor': singleVendor,
};

export function pluginSplitChunks(): DefaultRsbuildPlugin {
  return {
    name: 'plugin-split-chunks',
    setup(api) {
      api.modifyBundlerChain(
        async (chain, { isServer, isWebWorker, isServiceWorker }) => {
          if (isServer || isWebWorker || isServiceWorker) {
            chain.optimization.splitChunks(false);

            // web worker does not support dynamic imports, dynamicImportMode need set to eager
            if (isWebWorker || isServiceWorker) {
              // todo: not support in rspack
              chain.module.parser.merge({
                javascript: {
                  dynamicImportMode: 'eager',
                },
              });
            }

            return;
          }

          const config = api.getNormalizedConfig();
          const defaultConfig: SplitChunks = {
            // Optimize both `initial` and `async` chunks
            chunks: 'all',
            // When chunk size >= 50000 bytes, split it into separate chunk
            enforceSizeThreshold: 50000,
            cacheGroups: {},
          };
          const { chunkSplit } = config.performance;
          let userDefinedCacheGroups = {};
          if (chunkSplit.forceSplitting) {
            userDefinedCacheGroups = getUserDefinedCacheGroups(
              chunkSplit.forceSplitting,
            );
          }
          // Patch the override config difference between the `custom` strategy and other strategy.
          const override =
            chunkSplit.strategy === 'custom'
              ? // `chunkSplit.splitChunks` compat for Eden
                chunkSplit.splitChunks ?? chunkSplit.override
              : chunkSplit.override;
          // Apply different strategy
          const splitChunksOptions = await SPLIT_STRATEGY_DISPATCHER[
            chunkSplit.strategy
          ]({
            defaultConfig,
            override: override || {},
            userDefinedCacheGroups,
            rsbuildConfig: chunkSplit,
            rootPath: api.context.rootPath,
            polyfill: config.output.polyfill,
          });

          chain.optimization.splitChunks(splitChunksOptions);

          // should not extract runtime chunk when strategy is `all-in-one`
          if (chunkSplit.strategy !== 'all-in-one') {
            chain.optimization.runtimeChunk({
              name: RUNTIME_CHUNK_NAME,
            });
          }
        },
      );
    },
  };
}
