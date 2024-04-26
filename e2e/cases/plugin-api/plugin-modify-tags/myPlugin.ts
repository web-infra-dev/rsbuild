import type { RsbuildPlugin } from '@rsbuild/core';

export const myPlugin: RsbuildPlugin = {
  name: 'my-plugin',
  setup(api) {
    api.modifyHTMLTags(({ headTags, bodyTags }) => {
      headTags.push({
        tag: 'script',
        attrs: { id: 'foo', src: 'https://example.com/foo.js' },
      });

      bodyTags.push({
        tag: 'script',
        attrs: { id: 'bar', src: 'https://example.com/bar.js' },
      });

      return { headTags, bodyTags };
    });
  },
};
