import type { RsbuildPlugin } from '../types';

export const pluginPreloadOrPrefetch = (): RsbuildPlugin => ({
  name: 'rsbuild:preload-prefetch',

  setup(api) {
    api.modifyBundlerChain(
      async (chain, { CHAIN_ID, isServer, isWebWorker, isServiceWorker }) => {
        const config = api.getNormalizedConfig();
        const {
          performance: { preload, prefetch },
        } = config;

        if (isServer || isWebWorker || isServiceWorker) {
          return;
        }

        const HTMLCount = chain.entryPoints.values().length;

        const { HtmlPreloadOrPrefetchPlugin } = await import(
          '../rspack/preload/HtmlPreloadOrPrefetchPlugin'
        );

        if (prefetch) {
          chain
            .plugin(CHAIN_ID.PLUGIN.HTML_PREFETCH)
            .use(HtmlPreloadOrPrefetchPlugin, [
              prefetch,
              'prefetch',
              HTMLCount,
            ]);
        }

        if (preload) {
          chain
            .plugin(CHAIN_ID.PLUGIN.HTML_PRELOAD)
            .use(HtmlPreloadOrPrefetchPlugin, [preload, 'preload', HTMLCount]);
        }
      },
    );
  },
});
