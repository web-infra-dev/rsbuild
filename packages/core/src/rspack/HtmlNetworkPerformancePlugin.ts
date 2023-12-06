import type { Compiler, Compilation, RspackPluginInstance } from '@rspack/core';
import {
  upperFirst,
  type Preconnect,
  type DnsPrefetch,
  type PreconnectOption,
  type DnsPrefetchOption,
} from '@rsbuild/shared';
import type HtmlWebpackPlugin from 'html-webpack-plugin';

type NetworkPerformanceType = 'preconnect' | 'dnsPrefetch';

function generateLinks(
  options: PreconnectOption[] | DnsPrefetchOption[],
  type: NetworkPerformanceType,
): Array<HtmlWebpackPlugin.HtmlTagObject> {
  const relMap: Record<NetworkPerformanceType, string> = {
    preconnect: 'preconnect',
    dnsPrefetch: 'dns-prefetch',
  };

  return options.map((option) => ({
    tagName: 'link',
    attributes: {
      rel: relMap[type],
      ...option,
    },
    voidTag: false,
    meta: {},
  }));
}

export class HtmlNetworkPerformancePlugin implements RspackPluginInstance {
  readonly options: DnsPrefetch | Preconnect;

  readonly type: NetworkPerformanceType;

  HtmlPlugin: typeof HtmlWebpackPlugin;

  constructor(
    options: DnsPrefetch | Preconnect,
    type: NetworkPerformanceType,
    HtmlPlugin: typeof HtmlWebpackPlugin,
  ) {
    this.options = options;
    this.type = type;
    this.HtmlPlugin = HtmlPlugin;
  }

  apply(compiler: Compiler): void {
    compiler.hooks.compilation.tap(
      `HTML${this.type}Plugin`,
      (compilation: Compilation) => {
        // @ts-expect-error compilation type mismatch
        this.HtmlPlugin.getHooks(compilation).alterAssetTagGroups.tap(
          `HTML${upperFirst(this.type)}Plugin`,
          (htmlPluginData) => {
            const { headTags } = htmlPluginData;

            const options: PreconnectOption[] | DnsPrefetchOption[] =
              this.options.map((option) =>
                typeof option === 'string'
                  ? {
                      href: option,
                    }
                  : option,
              );

            if (options.length) {
              headTags.unshift(...generateLinks(options, this.type));
            }
            return htmlPluginData;
          },
        );
      },
    );
  }
}
