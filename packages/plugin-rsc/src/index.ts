import type { EnvironmentConfig, RsbuildPlugin } from '@rsbuild/core';
import type { PluginRSCOptions } from './types.js';
import { SSREntryPlugin } from './ssrEntryPlugin.js';

export const PLUGIN_RSC_NAME = 'rsbuild:rsc';

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

    api.modifyEnvironmentConfig((config, { name, mergeEnvironmentConfig }) => {
      const extraConfig: EnvironmentConfig = {
        tools: {
          swc: {
            // TODO: fix ts type
            rspackExperiments: {
              rsc: true,
            } as any,
          },
        },
      };

      if (name === ENVIRONMENT_NAMES.SERVER && entries.rsc) {
        if (!extraConfig.source) {
          extraConfig.source = {};
        }
        if (!extraConfig.source.entry) {
          extraConfig.source.entry = {};
        }
        extraConfig.source.entry.rsc = entries.rsc;
      }

      if (name === ENVIRONMENT_NAMES.CLIENT && entries.client) {
        if (!extraConfig.source) {
          extraConfig.source = {};
        }
        if (!extraConfig.source.entry) {
          extraConfig.source.entry = {};
        }
        extraConfig.source.entry.client = entries.client;
      }

      return mergeEnvironmentConfig(extraConfig, config);
    });

    // const { ServerPlugin, ClientPlugin } = createRSCPlugins();

    api.modifyBundlerChain(
      async (chain, { CHAIN_ID, environment }) => {
        if (environment.name == ENVIRONMENT_NAMES.SERVER) {
          if (entries.ssr) {
            chain.plugin(CHAIN_ID.PLUGIN.RSC_SSR_ENTRY).use(SSREntryPlugin, [entries.ssr]);
          }

          chain.module
            .rule(CHAIN_ID.RULE.RSC_RESOLVE)
            .issuerLayer('react-server-component')
            .resolve.conditionNames.add('react-server')
            .add('...');

          // chain.plugin(CHAIN_ID.PLUGIN.RSC_SERVER).use(ServerPlugin);
        }
        if (environment.name == ENVIRONMENT_NAMES.CLIENT) {
          // chain.plugin(CHAIN_ID.PLUGIN.RSC_CLIENT).use(ClientPlugin);
        }
      },
    );
  },
});
