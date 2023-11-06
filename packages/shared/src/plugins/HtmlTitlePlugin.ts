import type HtmlWebpackPlugin from 'html-webpack-plugin';
import type { Compiler, Compilation } from '@rspack/core';

export type HtmlTitlePluginOptions = {
  titles: Record<string, string>;
  HtmlPlugin: typeof HtmlWebpackPlugin;
};

export class HtmlTitlePlugin {
  readonly name: string;

  readonly titles: HtmlTitlePluginOptions['titles'];

  readonly HtmlPlugin: typeof HtmlWebpackPlugin;

  constructor(options: HtmlTitlePluginOptions) {
    this.name = 'HtmlTitlePlugin';
    this.titles = options.titles;
    this.HtmlPlugin = options.HtmlPlugin;
  }

  apply(compiler: Compiler) {
    compiler.hooks.compilation.tap(this.name, (compilation: Compilation) => {
      // @ts-expect-error compilation type mismatch
      this.HtmlPlugin.getHooks(compilation).alterAssetTagGroups.tap(
        this.name,
        (data) => {
          const matchedKey = Object.keys(this.titles).find(
            (key) => key === data.outputName,
          );

          if (matchedKey) {
            data.headTags.unshift({
              tagName: 'title',
              innerHTML: this.titles[matchedKey],
              attributes: {},
              voidTag: false,
              meta: {},
            });
          }

          return data;
        },
      );
    });
  }
}
