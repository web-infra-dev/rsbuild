import { DEFAULT_ASSET_PREFIX, type CrossOrigin } from '@rsbuild/shared';
import type { Compiler, RspackPluginInstance } from '@rspack/core';
import { getHTMLPlugin } from '../provider/htmlPluginUtil';

type CrossOriginOptions = {
  crossOrigin: CrossOrigin;
};

export class HtmlCrossOriginPlugin implements RspackPluginInstance {
  readonly name: string;

  readonly crossOrigin: CrossOrigin;

  constructor(options: CrossOriginOptions) {
    const { crossOrigin } = options;
    this.name = 'HtmlCrossOriginPlugin';
    this.crossOrigin = crossOrigin;
  }

  apply(compiler: Compiler): void {
    if (!this.crossOrigin) {
      return;
    }

    // no need to set crossorigin="anonymous" if asset domain is the same as
    // the page domain, align with webpack's crossOriginLoading logic.
    // see: https://github.com/webpack/webpack/blob/611bded369b5a9ea695f2669b25a6f88b67d7826/lib/runtime/LoadScriptRuntimeModule.js#L100-L111
    if (this.crossOrigin !== 'use-credentials') {
      const { publicPath } = compiler.options.output;
      if (
        !publicPath ||
        publicPath === DEFAULT_ASSET_PREFIX ||
        publicPath === 'auto'
      ) {
        return;
      }
    }

    compiler.hooks.compilation.tap(this.name, (compilation) => {
      getHTMLPlugin()
        // @ts-expect-error compilation type mismatch
        .getHooks(compilation)
        .alterAssetTags.tap(this.name, (alterAssetTags) => {
          const {
            assetTags: { scripts, styles },
          } = alterAssetTags;

          scripts.forEach((script) => {
            script.attributes.crossorigin ??= this.crossOrigin;
          });
          styles.forEach((style) => {
            style.attributes.crossorigin ??= this.crossOrigin;
          });

          return alterAssetTags;
        });
    });
  }
}
