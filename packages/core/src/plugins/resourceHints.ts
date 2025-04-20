import { HtmlResourceHintsPlugin } from '../rspack/resource-hints/HtmlResourceHintsPlugin';
import type { HtmlBasicTag, PreconnectOption, RsbuildPlugin } from '../types';

const generateLinks = (
  options: PreconnectOption[],
  rel: 'preconnect' | 'dns-prefetch',
): HtmlBasicTag[] =>
  options.map((option) => ({
    tag: 'link',
    attrs: {
      rel,
      ...option,
    },
  }));

export const pluginResourceHints = (): RsbuildPlugin => ({
  name: 'rsbuild:resource-hints',

  setup(api) {
    api.modifyHTMLTags(({ headTags, bodyTags }, { environment }) => {
      const { config } = environment;
      const { dnsPrefetch, preconnect } = config.performance;

      if (dnsPrefetch) {
        const attrs = dnsPrefetch.map((option) => ({ href: option }));
        if (attrs.length) {
          headTags.unshift(...generateLinks(attrs, 'dns-prefetch'));
        }
      }

      if (preconnect) {
        const attrs = preconnect.map((option) =>
          typeof option === 'string' ? { href: option } : option,
        );
        if (attrs.length) {
          headTags.unshift(...generateLinks(attrs, 'preconnect'));
        }
      }

      return { headTags, bodyTags };
    });

    api.modifyBundlerChain(async (chain, { CHAIN_ID, environment }) => {
      const { config, htmlPaths } = environment;

      if (Object.keys(htmlPaths).length === 0) {
        return;
      }

      const {
        performance: { preload, prefetch },
      } = config;
      const HTMLCount = chain.entryPoints.values().length;

      if (prefetch) {
        chain
          .plugin(CHAIN_ID.PLUGIN.HTML_PREFETCH)
          .use(HtmlResourceHintsPlugin, [
            prefetch === true ? {} : prefetch,
            'prefetch',
            HTMLCount,
          ]);
      }

      if (preload) {
        chain
          .plugin(CHAIN_ID.PLUGIN.HTML_PRELOAD)
          .use(HtmlResourceHintsPlugin, [
            preload === true ? {} : preload,
            'preload',
            HTMLCount,
          ]);
      }
    });
  },
});
