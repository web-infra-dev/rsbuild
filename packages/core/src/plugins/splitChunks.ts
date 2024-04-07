import assert from 'node:assert';
import {
  NODE_MODULES_REGEX,
  createDependenciesRegExp,
  type Polyfill,
  type CacheGroups,
  type SplitChunks,
  type ForceSplitting,
  type RsbuildChunkSplit,
} from '@rsbuild/shared';
import type { RsbuildPlugin } from '../types';

// We expose the three-layer to specify webpack chunk-split ability:
// 1. By strategy.There some best practice integrated in our internal strategy.
// 2. By forceSplitting config, which is designed to split chunks by user defined rules.That's easier to use than webpack raw config.
// 3. By override config, which is designed to override the raw config of webpack `splitChunks`.It has the highest priority.
// By the way, the config complexity is increasing gradually.

interface SplitChunksContext {
  /**
   * User defined cache groups which can be reused across different split strategies
   */
  userDefinedCacheGroups: CacheGroups;
  /**
   * Default split config in webpack
   */
  defaultConfig: Exclude<SplitChunks, false>;
  /**
   * User webpack `splitChunks` config
   */
  override: Exclude<SplitChunks, false>;
  /**
   * User Rsbuild `chunkSplit` config
   */
  userConfig: RsbuildChunkSplit;
  /**
   * The root path of current project
   */
  rootPath: string;
  /**
   * The polyfill mode.
   */
  polyfill: Polyfill;
}

function getUserDefinedCacheGroups(
  forceSplitting: ForceSplitting,
): CacheGroups {
  const cacheGroups: CacheGroups = {};
  const pairs = Array.isArray(forceSplitting)
    ? forceSplitting.map(
        (regexp, index) => [`force-split-${index}`, regexp] as const,
      )
    : Object.entries(forceSplitting);

  for (const [key, regexp] of pairs) {
    cacheGroups[key] = {
      test: regexp,
      name: key,
      chunks: 'all',
      // Ignore minimum size, minimum chunks and maximum requests and always create chunks for user defined cache group.
      enforce: true,
    };
  }

  return cacheGroups;
}

function splitByExperience(ctx: SplitChunksContext): SplitChunks {
  const { override, polyfill, defaultConfig, userDefinedCacheGroups } = ctx;
  const experienceCacheGroup: CacheGroups = {};

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

  for (const [name, test] of Object.entries(packageRegExps)) {
    const key = `lib-${name}`;

    experienceCacheGroup[key] = {
      test,
      priority: 0,
      name: key,
      reuseExistingChunk: true,
    };
  }

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

export const MODULE_PATH_REGEX =
  /.*[\\/]node_modules[\\/](?!\.pnpm[\\/])(?:(@[^\\/]+)[\\/])?([^\\/]+)/;

export function getPackageNameFromModulePath(modulePath: string) {
  const handleModuleContext = modulePath?.match(MODULE_PATH_REGEX);

  if (!handleModuleContext) {
    return undefined;
  }

  const [, scope, name] = handleModuleContext;
  const packageName = ['npm', (scope ?? '').replace('@', ''), name]
    .filter(Boolean)
    .join('.');

  return packageName;
}

function splitByModule(ctx: SplitChunksContext): SplitChunks {
  const { override, userDefinedCacheGroups, defaultConfig } = ctx;
  return {
    ...defaultConfig,
    minSize: 0,
    maxInitialRequests: Number.POSITIVE_INFINITY,
    ...override,
    cacheGroups: {
      ...defaultConfig.cacheGroups,
      ...userDefinedCacheGroups,
      // Core group
      vendors: {
        priority: -10,
        test: NODE_MODULES_REGEX,
        name(module) {
          return module
            ? getPackageNameFromModulePath(module.context!)
            : undefined;
        },
      },
      ...override.cacheGroups,
    },
  };
}

function splitBySize(ctx: SplitChunksContext): SplitChunks {
  const { override, userDefinedCacheGroups, defaultConfig, userConfig } = ctx;
  assert(userConfig.strategy === 'split-by-size');

  return {
    ...defaultConfig,
    minSize: userConfig.minSize ?? 0,
    maxSize: userConfig.maxSize ?? Number.POSITIVE_INFINITY,
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

  const singleVendorCacheGroup: CacheGroups = {
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

export const pluginSplitChunks = (): RsbuildPlugin => ({
  name: 'rsbuild:split-chunks',
  setup(api) {
    api.modifyBundlerChain(
      async (chain, { isServer, isWebWorker, isServiceWorker }) => {
        if (isServer || isWebWorker || isServiceWorker) {
          chain.optimization.splitChunks(false);

          // web worker does not support dynamic imports, dynamicImportMode need set to eager
          if (isWebWorker || isServiceWorker) {
            chain.module.parser.merge({
              javascript: {
                dynamicImportMode: 'eager',
              },
            });
          }

          return;
        }

        const config = api.getNormalizedConfig();
        const defaultConfig: Exclude<SplitChunks, false> = {
          // Optimize both `initial` and `async` chunks
          chunks: 'all',
          // When chunk size >= 50000 bytes, split it into separate chunk
          // @ts-expect-error Rspack type missing
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
            ? chunkSplit.splitChunks ?? chunkSplit.override
            : chunkSplit.override;

        // Apply different strategy
        const splitChunksOptions = await SPLIT_STRATEGY_DISPATCHER[
          chunkSplit.strategy || 'split-by-experience'
        ]({
          defaultConfig,
          override: override || {},
          userDefinedCacheGroups,
          userConfig: chunkSplit,
          rootPath: api.context.rootPath,
          polyfill: config.output.polyfill,
        });

        chain.optimization.splitChunks(
          // @ts-expect-error splitChunks type mismatch
          splitChunksOptions,
        );
      },
    );
  },
});
