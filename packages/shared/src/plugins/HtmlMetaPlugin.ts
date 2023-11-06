import type HtmlWebpackPlugin from 'html-webpack-plugin';
import type { Compiler, Compilation } from '@rspack/core';
import type { MetaAttrs } from '../types';

export type HtmlMetaPluginOptions = {
  meta: Record<string, MetaAttrs[]>;
  HtmlPlugin: typeof HtmlWebpackPlugin;
};

export class HtmlMetaPlugin {
  readonly name: string;

  readonly meta: HtmlMetaPluginOptions['meta'];

  readonly HtmlPlugin: typeof HtmlWebpackPlugin;

  constructor(options: HtmlMetaPluginOptions) {
    this.name = 'HtmlMetaPlugin';
    this.meta = options.meta;
    this.HtmlPlugin = options.HtmlPlugin;
  }

  apply(compiler: Compiler) {
    compiler.hooks.compilation.tap(this.name, (compilation: Compilation) => {
      // @ts-expect-error compilation type mismatch
      this.HtmlPlugin.getHooks(compilation).alterAssetTagGroups.tap(
        this.name,
        (data) => {
          const matchedKey = Object.keys(this.meta).find(
            (key) => key === data.outputName,
          );

          if (matchedKey) {
            data.headTags.unshift(
              ...this.meta[matchedKey].map((attr) => ({
                attributes: attr,
                meta: {},
                tagName: 'meta',
                voidTag: true,
              })),
            );
          }

          return data;
        },
      );
    });
  }
}
