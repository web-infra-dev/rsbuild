import type {
  HtmlBasicTag,
  PreconnectOption,
  DnsPrefetchOption,
} from '@rsbuild/shared';
import type { RsbuildPlugin } from '../types';

const generateLinks = (
  options: PreconnectOption[] | DnsPrefetchOption[],
  rel: 'preconnect' | 'dns-prefetch',
): HtmlBasicTag[] =>
  options.map((option) => ({
    tag: 'link',
    attrs: {
      rel,
      ...option,
    },
  }));

export const pluginNetworkPerformance = (): RsbuildPlugin => ({
  name: 'rsbuild:network-performance',

  setup(api) {
    api.modifyHTMLTags(({ headTags, bodyTags }) => {
      const config = api.getNormalizedConfig();
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
  },
});
