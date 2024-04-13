import type { RsbuildPlugin } from '@rsbuild/core';

export const myPlugin: RsbuildPlugin = {
  name: 'my-plugin',
  setup(api) {
    api.modifyHTMLTags(({ headTags, bodyTags }) => {
      headTags.push({
        tagName: 'script',
        voidTag: false,
        meta: {},
        attributes: { id: 'foo', src: 'https://example.com/foo.js' },
      });

      bodyTags.push({
        tagName: 'script',
        voidTag: false,
        meta: {},
        attributes: { id: 'bar', src: 'https://example.com/bar.js' },
      });

      return { headTags, bodyTags };
    });
  },
};
