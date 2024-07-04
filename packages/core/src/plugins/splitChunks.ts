import assert from 'node:assert';
import {
  type CacheGroups,
  type ForceSplitting,
  type Polyfill,
  type RsbuildChunkSplit,
  type SplitChunks,
  createDependenciesRegExp,
} from '@rsbuild/shared';
import { NODE_MODULES_REGEX } from '../constants';
import type { RsbuildPlugin } from '../types';

// We expose three layers to specify Rspack chunk-split config:
// 1. By strategy. Some best practices strategies.
// 2. By forceSplitting config, which is designed to split chunks by user defined rules.That's easier to use than Rspack raw config.
// 3. By override config, which is designed to override the raw config of Rspack `splitChunks`.It has the highest priority.
// By this way, the config complexity is increasing gradually.
interface SplitChunksContext {
  /**
   * Force splitting cache groups which can be reused across different split strategies
   */
  forceSplittingGroups: CacheGroups;
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

function getForceSplittingGroups(forceSplitting: ForceSplitting): CacheGroups {
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
      priority: 0,
      // Ignore minimum size, minimum chunks and maximum requests and always create chunks.
      enforce: true,
    };
  }

  return cacheGroups;
}

function splitByExperience(ctx: SplitChunksContext): SplitChunks {
  const { override, polyfill, defaultConfig, forceSplittingGroups } = ctx;
  const experienceCacheGroup: CacheGroups = {};

  const packageRegExps: Record<string, RegExp> = {
    lodash: createDependenciesRegExp('lodash', 'lodash-es'),
    axios: createDependenciesRegExp('axios', /axios-.+/),
  };

  if (polyfill === 'entry' || polyfill === 'usage') {
    packageRegExps.polyfill = createDependenciesRegExp(
      'tslib',
      'core-js',
      '@swc/helpers',
    );
  }

  for (const [name, test] of Object.entries(packageRegExps)) {
    const key = `lib-${name}`;

    experienceCacheGroup[key] = {
      test,
      priority: 0,
      name: key,
    };
  }

  return {
    ...defaultConfig,
    ...override,
    cacheGroups: {
      ...defaultConfig.cacheGroups,
      ...experienceCacheGroup,
      ...forceSplittingGroups,
      ...override.cacheGroups,
    },
  };
}

export const MODULE_PATH_REGEX: RegExp =
  /.*[\\/]node_modules[\\/](?!\.pnpm[\\/])(?:(@[^\\/]+)[\\/])?([^\\/]+)/;

export function getPackageNameFromModulePath(
  modulePath: string,
): string | undefined {
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
  const { override, forceSplittingGroups, defaultConfig } = ctx;
  return {
    ...defaultConfig,
    minSize: 0,
    maxInitialRequests: Number.POSITIVE_INFINITY,
    ...override,
    cacheGroups: {
      ...defaultConfig.cacheGroups,
      ...forceSplittingGroups,
      // Core group
      vendors: {
        priority: -9,
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
  const { override, forceSplittingGroups, defaultConfig, userConfig } = ctx;
  assert(userConfig.strategy === 'split-by-size');

  return {
    ...defaultConfig,
    minSize: userConfig.minSize ?? 0,
    maxSize: userConfig.maxSize ?? Number.POSITIVE_INFINITY,
    ...override,
    cacheGroups: {
      ...defaultConfig.cacheGroups,
      ...forceSplittingGroups,
      ...override.cacheGroups,
    },
  };
}

function splitCustom(ctx: SplitChunksContext): SplitChunks {
  const { override, forceSplittingGroups, defaultConfig } = ctx;
  return {
    ...defaultConfig,
    ...override,
    cacheGroups: {
      ...defaultConfig.cacheGroups,
      ...forceSplittingGroups,
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
  const { override, defaultConfig, forceSplittingGroups } = ctx;

  const singleVendorCacheGroup: CacheGroups = {
    singleVendor: {
      test: NODE_MODULES_REGEX,
      priority: 0,
      chunks: 'all',
      name: 'vendor',
      enforce: true,
    },
  };

  return {
    ...defaultConfig,
    ...override,
    cacheGroups: {
      ...defaultConfig.cacheGroups,
      ...singleVendorCacheGroup,
      ...forceSplittingGroups,
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
      async (chain, { environment, isServer, isWebWorker }) => {
        if (isServer || isWebWorker) {
          chain.optimization.splitChunks(false);

          // web worker does not support dynamic imports, dynamicImportMode need set to eager
          if (isWebWorker) {
            chain.module.parser.merge({
              javascript: {
                dynamicImportMode: 'eager',
              },
            });
          }

          return;
        }

        const { config } = environment;
        const defaultConfig: Exclude<SplitChunks, false> = {
          // Optimize both `initial` and `async` chunks
          chunks: 'all',
          // When chunk size >= 50000 bytes, split it into separate chunk
          // @ts-expect-error Rspack type missing
          enforceSizeThreshold: 50000,
          cacheGroups: {},
        };

        const { chunkSplit } = config.performance;
        let forceSplittingGroups = {};

        if (chunkSplit.forceSplitting) {
          forceSplittingGroups = getForceSplittingGroups(
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
          forceSplittingGroups,
          userConfig: chunkSplit,
          rootPath: api.context.rootPath,
          polyfill: config.output.polyfill,
        });

        chain.optimization.splitChunks(splitChunksOptions);
      },
    );
  },
});
