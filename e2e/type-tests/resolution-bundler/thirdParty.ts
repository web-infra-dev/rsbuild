import type { HtmlRspackPlugin, PostCSSOptions, PostCSSPlugin, ServerConfig } from '@rsbuild/core';

type CorsOptions = Exclude<ServerConfig['cors'], boolean | undefined>;

export const corsOptions = {
  origin: 'https://example.com',
  methods: ['GET', 'POST'],
} satisfies CorsOptions;

export const htmlPluginOptions = {
  filename: 'index.html',
  inject: 'body',
} satisfies HtmlRspackPlugin.Options;

export const postcssPlugin = {
  postcssPlugin: 'type-test',
} satisfies PostCSSPlugin;

export const postcssOptions = {
  from: 'input.css',
  to: 'output.css',
  plugins: [postcssPlugin],
} satisfies PostCSSOptions;
