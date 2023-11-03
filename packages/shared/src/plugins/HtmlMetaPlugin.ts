import type HtmlWebpackPlugin from 'html-webpack-plugin';
import type { HtmlTagObject } from 'html-webpack-plugin';
import type { Compiler, Compilation } from 'webpack';

export type HtmlMetaPluginOptions = {
  meta: Array<{
    tags: HtmlTagObject[];
    filename: string;
  }>;
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
      this.HtmlPlugin.getHooks(compilation).alterAssetTagGroups.tap(
        this.name,
        (data) => {
          const matched = this.meta.find(
            (item) => item.filename === data.outputName,
          );

          if (matched) {
            data.headTags.unshift(...matched.tags);
          }

          return data;
        },
      );
    });
  }
}
