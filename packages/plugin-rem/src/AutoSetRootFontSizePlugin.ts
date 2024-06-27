import path from 'node:path';
import {
  type Rspack,
  type ScriptLoading,
  ensureAssetPrefix,
  logger,
} from '@rsbuild/core';
import type HtmlWebpackPlugin from 'html-webpack-plugin';
import type { PluginRemOptions } from './types';

type AutoSetRootFontSizeOptions = Omit<
  PluginRemOptions,
  'pxtorem' | 'enableRuntime'
> & {
  /** expose root font size to global */
  rootFontSizeVariableName: string;
};

export async function getRootPixelCode(
  options: Required<AutoSetRootFontSizeOptions>,
  isCompress = false,
): Promise<string | undefined> {
  const code = genJSTemplate(options);

  if (!isCompress) {
    return code;
  }

  const { minify } = await import('terser');
  const { code: minifiedRuntimeCode } = await minify(
    {
      RootPixelCode: code,
    },
    {
      ecma: 5,
    },
  );
  return minifiedRuntimeCode;
}

export const DEFAULT_OPTIONS: Required<AutoSetRootFontSizeOptions> = {
  screenWidth: 375,
  rootFontSize: 50,
  maxRootFontSize: 64,
  widthQueryKey: '',
  rootFontSizeVariableName: 'ROOT_FONT_SIZE',
  excludeEntries: [],
  inlineRuntime: true,
  supportLandscape: false,
  useRootFontSizeBeyondMax: false,
};

export class AutoSetRootFontSizePlugin implements Rspack.RspackPluginInstance {
  readonly name: string = 'AutoSetRootFontSizePlugin';

  readonly distDir: string;

  options: Required<AutoSetRootFontSizeOptions>;

  entries: Array<string>;

  scriptPath: string;

  HtmlPlugin: typeof HtmlWebpackPlugin;

  scriptLoading: ScriptLoading;

  constructor(
    options: PluginRemOptions,
    entries: Array<string>,
    HtmlPlugin: typeof HtmlWebpackPlugin,
    distDir: string,
    scriptLoading: ScriptLoading,
  ) {
    this.options = { ...DEFAULT_OPTIONS, ...(options || {}) };
    this.scriptPath = '';
    this.distDir = distDir;
    this.entries = entries;
    this.HtmlPlugin = HtmlPlugin;
    this.scriptLoading = scriptLoading;
  }

  async getScriptPath(): Promise<string> {
    if (!this.scriptPath) {
      this.scriptPath = path.posix.join(
        this.distDir,
        `convert-rem.${RSBUILD_VERSION}.js`,
      );
    }

    return this.scriptPath;
  }

  apply(compiler: Rspack.Compiler): void {
    let runtimeCode: string | undefined;

    const getRuntimeCode = async () => {
      if (!runtimeCode) {
        const isCompress = process.env.NODE_ENV === 'production';
        runtimeCode = await getRootPixelCode(this.options, isCompress);
      }
      return runtimeCode;
    };

    if (!this.options.inlineRuntime) {
      compiler.hooks.thisCompilation.tap(
        this.name,
        (compilation: Rspack.Compilation) => {
          compilation.hooks.processAssets.tapPromise(
            {
              name: this.name,
              stage:
                compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_PRE_PROCESS,
            },
            async () => {
              const scriptPath = await this.getScriptPath();
              const code = await getRuntimeCode();
              compilation.emitAsset(
                scriptPath,
                new compiler.webpack.sources.RawSource(code, false),
              );
            },
          );
        },
      );
    }

    compiler.hooks.compilation.tap(this.name, (compilation) => {
      this.HtmlPlugin.getHooks(compilation).alterAssetTags.tapPromise(
        this.name,
        async (data) => {
          const isExclude = this.options.excludeEntries.find((item: string) => {
            if (!this.entries.includes(item)) {
              logger.error(`convertToRem: can't find the entryName: ${item}`);
              return false;
            }

            const reg = new RegExp(
              `(/${item}/index.html)|(/${item}.html)`,
              'gi',
            );
            return reg.test(data.outputName);
          });

          if (isExclude) {
            return data;
          }

          const scriptTag = {
            tagName: 'script',
            attributes: {
              type: 'text/javascript',
            },
            voidTag: false,
            meta: {},
          };

          if (this.options.inlineRuntime) {
            data.assetTags.scripts.unshift({
              ...scriptTag,
              innerHTML: await getRuntimeCode(),
            });
          } else {
            const { publicPath } = compilation.outputOptions;
            const url = ensureAssetPrefix(
              await this.getScriptPath(),
              publicPath,
            );

            const attributes: Record<string, string> = {
              ...scriptTag.attributes,
              src: url,
            };

            if (this.scriptLoading === 'defer') {
              attributes.defer = '';
            }
            if (this.scriptLoading === 'module') {
              attributes.type = 'module';
            }

            data.assetTags.scripts.unshift({
              ...scriptTag,
              attributes,
            });
          }

          return data;
        },
      );
    });
  }
}

export const genJSTemplate = (
  opts: Required<AutoSetRootFontSizeOptions>,
) => `function setRootPixel() {
  function getQuery(name) {
    return (new RegExp('[?&]' + name + '=([^&#\\b]+)').exec(location.search || '') || [])[1];
  }

  function setRootFontSize() {
    var widthQueryKey = '${opts.widthQueryKey}';
    var rem2px = ${opts.rootFontSize};
    var clientWidth;
    var docEl = document.documentElement;
    if (widthQueryKey && (+getQuery(widthQueryKey))) {
      clientWidth = +getQuery(widthQueryKey);
    } else {
      clientWidth = window.innerWidth && docEl.clientWidth ?
        Math.min(window.innerWidth, docEl.clientWidth) :
        (window.innerWidth || docEl.clientWidth || (document.body && document.body.clientWidth) || ${
          opts.screenWidth
        });
        ${
          opts.supportLandscape
            ? `
        var isLandscape = ((screen.orientation && screen.orientation.angle) || window.orientation) / 90 % 2;
        if (isLandscape) {
          var clientHeight = window.innerHeight && docEl.clientHeight ?
          Math.min(window.innerHeight, docEl.clientHeight) :
          (window.innerHeight || docEl.clientHeight || (document.body && document.body.clientHeight) || ${opts.screenWidth});

          clientWidth = Math.max(clientHeight, 350);
        }`
            : ''
        }
    }

    var htmlFontSizePx = (clientWidth * rem2px) / ${opts.screenWidth};
    var maxRootFontSize = ${opts.maxRootFontSize};

    ${
      opts.useRootFontSizeBeyondMax
        ? 'htmlFontSizePx = htmlFontSizePx < maxRootFontSize ? htmlFontSizePx : rem2px ;'
        : 'htmlFontSizePx = Math.min(htmlFontSizePx, maxRootFontSize);'
    }

    window.${opts.rootFontSizeVariableName} = htmlFontSizePx;
    docEl.style.fontSize = htmlFontSizePx + 'px';
  }

  function adjust(immediate) {
    if (immediate) {
      setRootFontSize();
      return;
    }
    setTimeout(setRootFontSize, 30);
  }

  adjust(true);

  window.addEventListener('resize', adjust, false);

  if ('onorientationchange' in window) {
    window.addEventListener('orientationchange', adjust, false);
  }
}

typeof window !== 'undefined' && setRootPixel();`;
