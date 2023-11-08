import type HtmlWebpackPlugin from 'html-webpack-plugin';
import type { Compiler, Compilation } from '@rspack/core';
import type { MetaAttrs } from '@rsbuild/shared';

export type HtmlInfo = {
  meta?: MetaAttrs[];
  title?: string;
  favicon?: string;
};

export type HtmlBasicPluginOptions = {
  info: Record<string, HtmlInfo>;
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
      const { title } = this.options.info[outputName];
      if (title) {
        headTags.unshift({
          tagName: 'title',
          innerHTML: title,
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
      const { meta } = this.options.info[outputName];
      if (meta) {
        headTags.unshift(
          ...meta.map((attr) => ({
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
      const { favicon } = this.options.info[outputName];
      if (favicon) {
        headTags.unshift({
          tagName: 'link',
          voidTag: true,
          attributes: {
            rel: 'icon',
            href: favicon,
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
