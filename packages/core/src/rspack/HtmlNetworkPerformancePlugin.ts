import type { Compiler, Compilation, RspackPluginInstance } from '@rspack/core';
import {
  upperFirst,
  type Preconnect,
  type DnsPrefetch,
  type PreconnectOption,
  type DnsPrefetchOption,
} from '@rsbuild/shared';
import type HtmlWebpackPlugin from 'html-webpack-plugin';
import { getHTMLPlugin } from '../provider/htmlPluginUtil';

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

  constructor(options: DnsPrefetch | Preconnect, type: NetworkPerformanceType) {
    this.options = options;
    this.type = type;
  }

  apply(compiler: Compiler): void {
    compiler.hooks.compilation.tap(
      `HTML${this.type}Plugin`,
      (compilation: Compilation) => {
        getHTMLPlugin()
          // @ts-expect-error compilation type mismatch
          .getHooks(compilation)
          .alterAssetTagGroups.tap(
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
