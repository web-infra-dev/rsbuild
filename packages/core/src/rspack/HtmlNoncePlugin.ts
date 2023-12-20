import type { Compiler, RspackPluginInstance } from '@rspack/core';
import { getHtmlPlugin } from '../htmlPluginUtil';

type NonceOptions = {
  nonce: string;
};

export class HtmlNoncePlugin implements RspackPluginInstance {
  readonly name: string;

  readonly nonce: string;

  constructor(options: NonceOptions) {
    const { nonce } = options;
    this.name = 'HtmlNoncePlugin';
    this.nonce = nonce;
  }

  apply(compiler: Compiler): void {
    if (!this.nonce) {
      return;
    }

    compiler.hooks.compilation.tap(this.name, (compilation) => {
      getHtmlPlugin()
        // @ts-expect-error compilation type mismatch
        .getHooks(compilation)
        .alterAssetTags.tap(this.name, (alterAssetTags) => {
          const {
            assetTags: { scripts },
          } = alterAssetTags;

          scripts.forEach((script) => (script.attributes.nonce = this.nonce));
          return alterAssetTags;
        });
    });
  }
}
