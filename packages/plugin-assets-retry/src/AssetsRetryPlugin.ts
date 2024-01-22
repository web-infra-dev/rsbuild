import path from 'node:path';
import WebpackSources from '@rsbuild/shared/webpack-sources';
import {
  fse,
  withPublicPath,
  generateScriptTag,
  getPublicPathFromCompiler,
  type Rspack,
} from '@rsbuild/shared';
import type HtmlWebpackPlugin from 'html-webpack-plugin';
import type { PluginAssetsRetryOptions } from './types';

export class AssetsRetryPlugin implements Rspack.RspackPluginInstance {
  readonly name: string;

  readonly distDir: string;

  readonly inlineScript: boolean;

  readonly HtmlPlugin: typeof HtmlWebpackPlugin;

  scriptPath: string;

  readonly #retryOptions: PluginAssetsRetryOptions;

  constructor(
    options: PluginAssetsRetryOptions & {
      distDir: string;
      HtmlPlugin: typeof HtmlWebpackPlugin;
    },
  ) {
    const {
      distDir,
      HtmlPlugin,
      inlineScript = true,
      ...retryOptions
    } = options;
    this.name = 'AssetsRetryPlugin';
    this.#retryOptions = retryOptions;
    this.distDir = distDir;
    this.HtmlPlugin = HtmlPlugin;
    this.inlineScript = inlineScript;
    this.scriptPath = '';
  }

  async getRetryCode() {
    const { default: serialize } = await import('serialize-javascript');
    const runtimeFilePath = path.join(__dirname, './runtime.js');
    const runtimeCode = await fse.readFile(runtimeFilePath, 'utf-8');
    return `(function(){${runtimeCode};init(${serialize(
      this.#retryOptions,
    )});})()`;
  }

  async getScriptPath() {
    if (!this.scriptPath) {
      this.scriptPath = path.join(
        this.distDir,
        `assets-retry.${RSBUILD_VERSION}.js`,
      );
    }
    return this.scriptPath;
  }

  apply(compiler: Rspack.Compiler): void {
    if (!this.inlineScript) {
      compiler.hooks.thisCompilation.tap(
        this.name,
        (compilation: Rspack.Compilation) => {
          compilation.hooks.processAssets.tapPromise(
            {
              name: this.name,
              stage:
                compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_PRE_PROCESS,
            },
            async (assets) => {
              const scriptPath = await this.getScriptPath();
              assets[scriptPath] = new WebpackSources.RawSource(
                await this.getRetryCode(),
                false,
              );
            },
          );
        },
      );
    }

    compiler.hooks.compilation.tap(this.name, (compilation) => {
      // the behavior of inject/modify tags in afterTemplateExecution hook will not take effect when inject option is false
      // @ts-expect-error compilation type mismatch
      this.HtmlPlugin.getHooks(compilation).alterAssetTagGroups.tapPromise(
        this.name,
        async (data) => {
          const scriptTag = generateScriptTag();

          if (this.inlineScript) {
            data.headTags.unshift({
              ...scriptTag,
              innerHTML: await this.getRetryCode(),
            });
          } else {
            const publicPath = getPublicPathFromCompiler(compiler);
            const url = withPublicPath(await this.getScriptPath(), publicPath);
            data.headTags.unshift({
              ...scriptTag,
              attributes: {
                ...scriptTag.attributes,
                src: url,
              },
            });
          }

          return data;
        },
      );
    });
  }
}
