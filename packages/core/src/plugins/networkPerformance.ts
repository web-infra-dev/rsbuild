import { isHtmlDisabled } from '@rsbuild/shared';
import type { RsbuildPlugin } from '../types';

export const pluginNetworkPerformance = (): RsbuildPlugin => ({
  name: 'rsbuild:network-performance',

  setup(api) {
    api.modifyBundlerChain(async (chain, { CHAIN_ID, target }) => {
      const config = api.getNormalizedConfig();
      const {
        performance: { dnsPrefetch, preconnect },
      } = config;

      if (isHtmlDisabled(config, target)) {
        return;
      }

      const { HtmlNetworkPerformancePlugin } = await import(
        '../rspack/HtmlNetworkPerformancePlugin'
      );

      if (dnsPrefetch) {
        chain
          .plugin(CHAIN_ID.PLUGIN.HTML_DNS_PREFETCH)
          .use(HtmlNetworkPerformancePlugin, [dnsPrefetch, 'dnsPrefetch']);
      }

      if (preconnect) {
        chain
          .plugin(CHAIN_ID.PLUGIN.HTML_PRECONNECT)
          .use(HtmlNetworkPerformancePlugin, [preconnect, 'preconnect']);
      }
    });
  },
});
