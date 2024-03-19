import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  output: {
    filenameHash: false,
  },
  html: {
    tags: [
      {
        tag: 'script',
        attrs: { src: 'https://www.cdn.com/foo.js' },
        append: false,
      },
      (tags) => {
        tags.push({ tag: 'script', attrs: { src: 'bar.js' }, append: false });
        return tags;
      },
      { tag: 'meta', attrs: { name: 'referrer', content: 'origin' } },
    ],
  },
});
