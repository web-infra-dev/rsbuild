import type { CacheGroup, Rspack } from '@rsbuild/shared';
import { rspack } from '@rspack/core';
import type { RspackPluginInstance } from '@rspack/core';
import { DEFAULT_ASSET_PREFIX } from '../constants';
import type { RsbuildPlugin } from '../types';

/**
 * Force remote entry not be affected by user's chunkSplit strategy,
 * Otherwise, the remote chunk will not be loaded correctly.
 * @see https://github.com/web-infra-dev/rsbuild/discussions/1461#discussioncomment-8329790
 */
class PatchSplitChunksPlugin implements RspackPluginInstance {
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  apply(compiler: Rspack.Compiler): void {
    const { splitChunks } = compiler.options.optimization;

    if (!splitChunks) {
      return;
    }

    const applyPatch = (cacheGroup: CacheGroup) => {
      if (typeof cacheGroup !== 'object' || cacheGroup instanceof RegExp) {
        return;
      }

      // cacheGroup.chunks will inherit splitChunks.chunks
      // so we only need to modify the chunks that are set separately.
      const { chunks } = cacheGroup;
      if (!chunks) {
        return;
      }

      if (typeof chunks === 'function') {
        const prevChunks = chunks;

        cacheGroup.chunks = (chunk) => {
          if (chunk.name && chunk.name === this.name) {
            return false;
          }
          return prevChunks(chunk);
        };
        return;
      }

      if (chunks === 'all') {
        cacheGroup.chunks = (chunk) => {
          if (chunk.name && chunk.name === this.name) {
            return false;
          }
          return true;
        };
        return;
      }

      if (chunks === 'initial') {
        cacheGroup.chunks = (chunk) => {
          if (chunk.name && chunk.name === this.name) {
            return false;
          }
          return chunk.isOnlyInitial();
        };
        return;
      }
    };

    // patch splitChunk.chunks
    applyPatch(splitChunks);

    const { cacheGroups } = splitChunks;
    if (!cacheGroups) {
      return;
    }

    // patch splitChunk.cacheGroups[key].chunks
    for (const cacheGroupKey of Object.keys(cacheGroups)) {
      applyPatch(cacheGroups[cacheGroupKey]);
    }
  }
}

export function pluginModuleFederation(): RsbuildPlugin {
  return {
    name: 'rsbuild:module-federation',

    setup(api) {
      api.modifyEnvironmentConfig((config) => {
        /**
         * Currently, splitChunks will take precedence over module federation shared modules.
         * So we need to disable the default split chunks rules to make shared modules to work properly.
         * @see https://github.com/module-federation/module-federation-examples/issues/3161
         */
        if (
          config.moduleFederation?.options &&
          config.performance?.chunkSplit?.strategy === 'split-by-experience'
        ) {
          config.performance.chunkSplit = {
            ...config.performance.chunkSplit,
            strategy: 'custom',
          };
        }
      });

      api.modifyBundlerChain(
        async (chain, { CHAIN_ID, target, environment }) => {
          const config = api.getNormalizedConfig({ environment });

          if (!config.moduleFederation?.options || target !== 'web') {
            return;
          }

          const { options } = config.moduleFederation;

          chain
            .plugin(CHAIN_ID.PLUGIN.MODULE_FEDERATION)
            .use(rspack.container.ModuleFederationPlugin, [options]);

          if (options.name) {
            chain
              .plugin('mf-patch-split-chunks')
              .use(PatchSplitChunksPlugin, [options.name]);
          }

          const publicPath = chain.output.get('publicPath');

          // set the default publicPath to 'auto' to make MF work
          if (publicPath === DEFAULT_ASSET_PREFIX) {
            chain.output.set('publicPath', 'auto');
          }
        },
      );
    },
  };
}
