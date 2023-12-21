import type HtmlWebpackPlugin from 'html-webpack-plugin';
import type { Compiler, Compilation } from '@rspack/core';
import { getHTMLPlugin } from '../provider/htmlPluginUtil';

export type HtmlInfo = {
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
      title = '',
    ) => {
      headTags.unshift({
        tagName: 'title',
        innerHTML: title,
        attributes: {},
        voidTag: false,
        meta: {},
      });
    };

    const addFavicon = (
      headTags: HtmlWebpackPlugin.HtmlTagObject[],
      entryName: string,
    ) => {
      const { favicon } = this.options.info[entryName];
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
      getHTMLPlugin()
        // @ts-expect-error compilation type mismatch
        .getHooks(compilation)
        .alterAssetTagGroups.tap(this.name, (data) => {
          const entryName = data.plugin.options?.entryName;

          if (!entryName) {
            return data;
          }

          const { headTags } = data;
          const { templateContent } = this.options.info[entryName];

          if (!hasTitle(templateContent)) {
            addTitleTag(headTags, data.plugin.options?.title);
          }

          addFavicon(headTags, entryName);
          return data;
        });
    });
  }
}
