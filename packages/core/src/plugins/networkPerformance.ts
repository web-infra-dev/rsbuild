import type { RsbuildPlugin } from '../types';

export const pluginNetworkPerformance = (): RsbuildPlugin => ({
  name: `plugin-network-performance`,

  setup(api) {
    api.modifyBundlerChain(
      async (
        chain,
        { CHAIN_ID, isServer, isWebWorker, isServiceWorker, HtmlPlugin },
      ) => {
        const config = api.getNormalizedConfig();
        const {
          performance: { dnsPrefetch, preconnect },
        } = config;

        if (isServer || isWebWorker || isServiceWorker) {
          return;
        }

        const { HtmlNetworkPerformancePlugin } = await import(
          '../rspack/HtmlNetworkPerformancePlugin'
        );

        if (dnsPrefetch) {
          chain
            .plugin(CHAIN_ID.PLUGIN.HTML_DNS_PREFETCH)
            .use(HtmlNetworkPerformancePlugin, [
              dnsPrefetch,
              'dnsPrefetch',
              HtmlPlugin,
            ]);
        }

        if (preconnect) {
          chain
            .plugin(CHAIN_ID.PLUGIN.HTML_PRECONNECT)
            .use(HtmlNetworkPerformancePlugin, [
              preconnect,
              'preconnect',
              HtmlPlugin,
            ]);
        }
      },
    );
  },
});
