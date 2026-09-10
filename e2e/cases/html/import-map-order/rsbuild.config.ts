import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  html: {
    tags: [
      {
        tag: 'script',
        attrs: { id: 'first-map', type: 'importmap' },
        children: '{}',
      },
      { tag: 'meta', attrs: { id: 'meta', name: 'description' } },
      {
        tag: 'link',
        attrs: {
          id: 'preload',
          rel: 'alternate MODULEPRELOAD',
          href: 'data:text/javascript,export{}',
        },
      },
      {
        tag: 'script',
        attrs: { id: 'second-map', type: 'IMPORTMAP' },
        children: '{}',
      },
      {
        tag: 'script',
        attrs: { id: 'body-module', type: 'MODULE' },
        head: false,
      },
      {
        tag: 'script',
        attrs: { id: 'body-map', type: 'importmap' },
        children: '{}',
        head: false,
      },
    ],
  },
});
