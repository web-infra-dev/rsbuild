import { isRegExp } from 'node:util/types';
import type { RspackPluginInstance } from '@rspack/core';
import { rspack } from '@rspack/core';
import type { RsbuildPlugin, Rspack } from '../types';

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

    const applyPatch = (
      config:
        | Rspack.OptimizationSplitChunksCacheGroup
        | Rspack.OptimizationSplitChunksOptions,
    ) => {
      if (typeof config !== 'object' || isRegExp(config)) {
        return;
      }

      // cacheGroup.chunks will inherit splitChunks.chunks
      // so we only need to modify the chunks that are set separately.
      const { chunks } = config;
      if (!chunks || chunks === 'async') {
        return;
      }

      if (typeof chunks === 'function') {
        const prevChunks = chunks;

        config.chunks = (chunk) => {
          if (chunk.name && chunk.name === this.name) {
            return false;
          }
          return prevChunks(chunk);
        };
        return;
      }

      if (chunks === 'all') {
        config.chunks = (chunk) => {
          if (chunk.name && chunk.name === this.name) {
            return false;
          }
          return true;
        };
        return;
      }

      if (chunks === 'initial') {
        config.chunks = (chunk) => {
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
      if (cacheGroups[cacheGroupKey]) {
        applyPatch(cacheGroups[cacheGroupKey]);
      }
    }
  }
}

export function pluginModuleFederation(): RsbuildPlugin {
  return {
    name: 'rsbuild:module-federation',

    setup(api) {
      // Rspack only
      if (api.context.bundlerType === 'webpack') {
        return;
      }

      api.modifyRsbuildConfig((config) => {
        const { moduleFederation } = config;

        if (!moduleFederation?.options) {
          return;
        }

        // Change some default configs for remote modules
        if (moduleFederation.options.exposes) {
          const userConfig = api.getRsbuildConfig('original');

          config.dev ||= {};
          config.server ||= {};

          // Allow remote modules to be loaded by setting CORS headers
          // This is required for MF to work properly across different origins
          if (userConfig.server?.cors === undefined) {
            config.server.cors = true;
          }

          // For remote modules, Rsbuild should send the ws request to the provider's dev server.
          // This allows the provider to do HMR when the provider module is loaded in the consumer's page.
          if (config.server?.port && !config.dev.client?.port) {
            config.dev.client ||= {};
            config.dev.client.port = config.server.port;
          }

          // Change the default assetPrefix to `true` for remote modules.
          // This ensures that the remote module's assets can be requested by consumer apps with the correct URL.
          if (
            userConfig.dev?.assetPrefix === undefined &&
            config.dev.assetPrefix === config.server?.base
          ) {
            config.dev.assetPrefix = true;
          }
        }
      });

      api.modifyEnvironmentConfig((config) => {
        if (!config.moduleFederation?.options) {
          return;
        }

        /**
         * Currently, splitChunks will take precedence over module federation shared modules.
         * So we need to disable the default split chunks rules to make shared modules to work properly.
         * @see https://github.com/module-federation/module-federation-examples/issues/3161
         */
        if (
          config.performance?.chunkSplit?.strategy === 'split-by-experience'
        ) {
          config.performance.chunkSplit = {
            ...config.performance.chunkSplit,
            strategy: 'custom',
          };
        }

        // Module Federation runtime uses ES6+ syntax,
        // adding to include and let SWC transform it
        config.source.include = [
          ...(config.source.include || []),
          /@module-federation[\\/]/,
        ];
      });

      api.modifyBundlerChain(
        async (chain, { CHAIN_ID, target, environment }) => {
          const { config } = environment;

          if (!config.moduleFederation?.options || target !== 'web') {
            return;
          }

          const { options } = config.moduleFederation;

          chain
            .plugin(CHAIN_ID.PLUGIN.MODULE_FEDERATION)
            .use(rspack.container.ModuleFederationPlugin, [options]);

          if (options.name) {
            if (options.exposes) {
              chain
                .plugin('mf-patch-split-chunks')
                .use(PatchSplitChunksPlugin, [options.name]);
            }

            // `uniqueName` is required for react refresh to work
            if (!chain.output.get('uniqueName')) {
              chain.output.set('uniqueName', options.name);
            }
          }
        },
      );
    },
  };
}
