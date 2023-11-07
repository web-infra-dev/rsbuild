import type HtmlWebpackPlugin from 'html-webpack-plugin';
import type { Compiler, Compilation } from '@rspack/core';
import type { MetaAttrs } from '@rsbuild/shared';

export type HtmlBasicPluginOptions = {
  meta: Record<string, MetaAttrs[]>;
  titles: Record<string, string>;
  faviconUrls: Record<string, string>;
  HtmlPlugin: typeof HtmlWebpackPlugin;
};

export class HtmlBasicPlugin {
  readonly name: string;

  readonly options: HtmlBasicPluginOptions;

  readonly HtmlPlugin: typeof HtmlWebpackPlugin;

  constructor(options: HtmlBasicPluginOptions) {
    this.name = 'HtmlBasicPlugin';
    this.options = options;
    this.HtmlPlugin = options.HtmlPlugin;
  }

  apply(compiler: Compiler) {
    const addTitleTag = (
      headTags: HtmlWebpackPlugin.HtmlTagObject[],
      outputName: string,
    ) => {
      const { titles } = this.options;
      const matched = Object.keys(titles).find((key) => key === outputName);
      if (matched) {
        headTags.unshift({
          tagName: 'title',
          innerHTML: titles[matched],
          attributes: {},
          voidTag: false,
          meta: {},
        });
      }
    };

    const addMetaTag = (
      headTags: HtmlWebpackPlugin.HtmlTagObject[],
      outputName: string,
    ) => {
      const { meta } = this.options;
      const matched = Object.keys(meta).find((key) => key === outputName);
      if (matched) {
        headTags.unshift(
          ...meta[matched].map((attr) => ({
            tagName: 'meta',
            attributes: attr,
            meta: {},
            voidTag: true,
          })),
        );
      }
    };

    const addFavicon = (
      headTags: HtmlWebpackPlugin.HtmlTagObject[],
      outputName: string,
    ) => {
      const { faviconUrls } = this.options;
      const matched = Object.keys(faviconUrls).find(
        (key) => key === outputName,
      );
      if (matched) {
        headTags.unshift({
          tagName: 'link',
          voidTag: true,
          attributes: {
            rel: 'icon',
            href: faviconUrls[matched],
          },
          meta: {},
        });
      }
    };

    compiler.hooks.compilation.tap(this.name, (compilation: Compilation) => {
      // @ts-expect-error compilation type mismatch
      this.HtmlPlugin.getHooks(compilation).alterAssetTagGroups.tap(
        this.name,
        (data) => {
          const { headTags, outputName } = data;
          addTitleTag(headTags, outputName);
          addMetaTag(headTags, outputName);
          addFavicon(headTags, outputName);
          return data;
        },
      );
    });
  }
}
