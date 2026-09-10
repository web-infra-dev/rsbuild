import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  output: {
    module: true,
    externals: { 'external-module': 'external-module' },
  },
  html: {
    tags: [
      {
        tag: 'script',
        attrs: { id: 'import-map', type: 'importmap' },
        children: JSON.stringify({
          imports: { 'external-module': '/external.js' },
        }),
        append: false,
      },
      {
        tag: 'style',
        attrs: { id: 'inline-style' },
        children: 'body { --nonce-test: applied; }',
      },
      {
        tag: 'link',
        attrs: {
          id: 'script-preload',
          rel: 'preload',
          as: 'script',
          href: '/external.js',
        },
      },
      {
        tag: 'script',
        attrs: {
          id: 'explicit',
          type: 'application/json',
          nonce: 'CUSTOM_NONCE',
        },
        children: '{}',
      },
      {
        tag: 'script',
        attrs: { id: 'disabled', type: 'application/json', nonce: false },
        children: '{}',
      },
      {
        tag: 'script',
        attrs: { id: 'removed', type: 'application/json' },
        children: '{}',
      },
      (tags) => {
        for (const tag of tags) {
          if (tag.attrs?.id === 'removed') {
            delete tag.attrs.nonce;
          }
        }
        tags.push({
          tag: 'script',
          attrs: { id: 'callback-added', type: 'application/json' },
          children: '{}',
        });
      },
    ],
  },
});
