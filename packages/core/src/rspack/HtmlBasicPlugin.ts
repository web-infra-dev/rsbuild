import HtmlWebpackPlugin from 'html-webpack-plugin';
import type { Compiler, Compilation } from '@rspack/core';

export type HtmlInfo = {
  title?: string;
  favicon?: string;
  templateContent?: string;
};

export type HtmlBasicPluginOptions = {
  info: Record<string, HtmlInfo>;
};

export const hasTitle = (html?: string): boolean =>
  html ? /<title/i.test(html) && /<\/title/i.test(html) : false;

export class HtmlBasicPlugin {
  readonly name: string;

  readonly options: HtmlBasicPluginOptions;

  constructor(options: HtmlBasicPluginOptions) {
    this.name = 'HtmlBasicPlugin';
    this.options = options;
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
      HtmlWebpackPlugin.getHooks(compilation).alterAssetTagGroups.tap(
        this.name,
        (data) => {
          const { headTags, outputName } = data;
          const { templateContent } = this.options.info[outputName];

          if (!hasTitle(templateContent)) {
            addTitleTag(headTags, outputName);
          }

          addFavicon(headTags, outputName);
          return data;
        },
      );
    });
  }
}
