import type { Compiler, RspackPluginInstance } from '@rspack/core';
import { getHTMLPlugin } from '../htmlUtils';
import { createVirtualModule } from '@rsbuild/shared';

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

    // apply __webpack_nonce__
    // https://webpack.js.org/guides/csp/
    const injectCode = createVirtualModule(
      `__webpack_nonce__ = "${this.nonce}";`,
    );
    new compiler.webpack.EntryPlugin(compiler.context, injectCode, {
      name: undefined,
    }).apply(compiler);

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
