import type { Compiler, RspackPluginInstance } from '@rspack/core';
import { getHTMLPlugin } from '../provider/htmlPluginUtil';

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
      getHTMLPlugin()
        .getHooks(compilation)
        // use alterAssetTagGroups to update tags injected by alterAssetTags
        .alterAssetTagGroups.tap(this.name, (data) => {
          const { headTags, bodyTags } = data;
          const allTags = [...headTags, ...bodyTags];

          for (const tag of allTags) {
            if (tag.tagName === 'script' || tag.tagName === 'style') {
              tag.attributes ??= {};
              tag.attributes.nonce = this.nonce;
            }
          }

          return data;
        });
    });
  }
}
