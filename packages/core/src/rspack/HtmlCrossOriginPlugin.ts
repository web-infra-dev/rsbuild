import type { CrossOrigin } from '@rsbuild/shared';
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
    if (
      !this.crossOrigin ||
      // align with crossOriginLoading logic
      // https://github.com/web-infra-dev/rspack/blob/bc8e67b5419adda15c2b389517c9b37d02c8240f/crates/rspack_plugin_runtime/src/runtime_module/load_script.rs#L39
      (compiler.options.output.publicPath === '/' &&
        this.crossOrigin !== ('use-credentials' as const))
    ) {
      return;
    }

    compiler.hooks.compilation.tap(this.name, (compilation) => {
      getHTMLPlugin()
        // @ts-expect-error compilation type mismatch
        .getHooks(compilation)
        .alterAssetTags.tap(this.name, (alterAssetTags) => {
          const {
            assetTags: { scripts, styles },
          } = alterAssetTags;

          scripts.forEach(
            (script) => (script.attributes.crossorigin = this.crossOrigin),
          );
          styles.forEach(
            (style) => (style.attributes.crossorigin = this.crossOrigin),
          );

          return alterAssetTags;
        });
    });
  }
}
