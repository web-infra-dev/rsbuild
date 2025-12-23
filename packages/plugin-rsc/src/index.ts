import type { RsbuildConfig, RsbuildPlugin, SourceConfig } from '@rsbuild/core';
import { rspack } from '@rsbuild/core';
import { CHAIN_ID } from '../../core/src/configChain.js';
import { SsrEntryPlugin } from './ssrEntryPlugin.js';
import type { PluginRSCOptions } from './types.js';

export const PLUGIN_RSC_NAME = 'rsbuild:rsc';

const { createRscPlugins, RSC_LAYERS_NAMES } = rspack.experiments;

const ENVIRONMENT_NAMES = {
  SERVER: 'server',
  CLIENT: 'client',
};

export const pluginRSC = (
  pluginOptions: PluginRSCOptions = {},
): RsbuildPlugin => ({
  name: PLUGIN_RSC_NAME,

  setup(api) {
    const entries = pluginOptions.entries || {};

    api.modifyRsbuildConfig((config, { mergeRsbuildConfig }) => {
      const serverSource: SourceConfig | undefined = entries.rsc
        ? {
            entry: {
              index: {
                import: entries.rsc,
                layer:
                  rspack.experiments.RSC_LAYERS_NAMES.reactServerComponents,
              },
            },
          }
        : undefined;

      const clientSource: SourceConfig | undefined = entries.client
        ? {
            entry: {
              index: entries.client,
            },
          }
        : undefined;

      const rscEnvironmentsConfig: RsbuildConfig = {
        tools: {
          swc: {
            rspackExperiments: {
              reactServerComponents: true,
            },
          },
        },
        environments: {
          server: {
            source: serverSource,
            output: {
              target: 'node',
            },
          },
          client: {
            source: clientSource,
            output: {
              target: 'web',
            },
          },
        },
      };
      return mergeRsbuildConfig(config, rscEnvironmentsConfig);
    });

    let rscPlugins: ReturnType<typeof createRscPlugins>;

    api.modifyBundlerChain(async (chain, { environment }) => {
      // The RSC plugin is currently incompatible with lazyCompilation; this feature has been forcibly disabled.
      chain.lazyCompilation(false);

      if (!rscPlugins) {
        rscPlugins = createRscPlugins();
      }

      if (environment.name === ENVIRONMENT_NAMES.SERVER) {
        if (entries.ssr) {
          chain
            .plugin(CHAIN_ID.PLUGIN.RSC_SSR_ENTRY)
            .use(SsrEntryPlugin, [entries.ssr]);
        } else {
          // If entries.ssr exists, SsrEntryPlugin will handle the addition, so no need to add it again.
          chain.module
            .rule(CHAIN_ID.RULE.RSC_RESOLVE)
            .issuerLayer(RSC_LAYERS_NAMES.reactServerComponents)
            .resolve.conditionNames.add('react-server')
            .add('...');
        }
        chain.plugin(CHAIN_ID.PLUGIN.RSC_SERVER).use(rscPlugins.ServerPlugin);
      }
      if (environment.name === ENVIRONMENT_NAMES.CLIENT) {
        chain.plugin(CHAIN_ID.PLUGIN.RSC_CLIENT).use(rscPlugins.ClientPlugin);
      }
    });
  },
});
