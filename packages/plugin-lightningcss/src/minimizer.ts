/**
 * modified from https://github.com/fz6m/lightningcss-loader
 * MIT License https://github.com/fz6m/lightningcss-loader/blob/main/LICENSE
 * Author @fz6m
 */
import { Buffer } from 'node:buffer';
import type { Rspack } from '@rsbuild/core';
import * as lightningcss from 'lightningcss';
import type { LightningCSSMinifyPluginOptions, Lightningcss } from './types';

const PLUGIN_NAME = 'lightningcss-minify-plugin';

const CSS_REGEX = /\.css$/;

export class LightningCSSMinifyPlugin {
  private readonly options: LightningCSSMinifyPluginOptions;

  private readonly transform: Lightningcss['transform'];

  constructor(opts: LightningCSSMinifyPluginOptions = {}) {
    const { implementation } = opts;
    this.transform = implementation?.transform ?? lightningcss.transform;
    this.options = opts;
  }

  apply(compiler: Rspack.Compiler) {
    compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation) => {
      compilation.hooks.processAssets.tapPromise(
        {
          name: PLUGIN_NAME,
          stage: (compilation as any)?.PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE,
        },
        async () => await this.transformAssets(compilation),
      );

      compilation.hooks.statsPrinter.tap(PLUGIN_NAME, (statsPrinter) => {
        statsPrinter.hooks.print
          .for('asset.info.minimized')
          .tap(PLUGIN_NAME, (minimized, { green, formatFlag }) =>
            minimized && green && formatFlag
              ? green(formatFlag('minimized'))
              : '',
          );
      });
    });
  }

  private async transformAssets(
    compilation: Rspack.Compilation,
  ): Promise<void> {
    const {
      options: { devtool },
      webpack: {
        sources: { SourceMapSource, RawSource },
      },
    } = compilation.compiler;

    const sourcemap =
      this.options.sourceMap === undefined
        ? ((devtool && (devtool as string).includes('source-map')) as boolean)
        : this.options.sourceMap;

    const { targets: userTargets, ...transformOptions } = this.options;

    const assets = compilation.getAssets().filter(
      (asset) =>
        // Filter out already minimized
        !asset.info.minimized &&
        // Filter out by file type
        CSS_REGEX.test(asset.name),
    );

    await Promise.all(
      assets.map(async (asset) => {
        const { source, map } = asset.source.sourceAndMap();
        const sourceAsString = source.toString();
        const code = typeof source === 'string' ? Buffer.from(source) : source;

        const result = this.transform({
          filename: asset.name,
          code,
          minify: true,
          sourceMap: sourcemap,
          ...transformOptions,
        });
        const codeString = result.code.toString();

        compilation.updateAsset(
          asset.name,
          // @ts-ignore
          sourcemap
            ? new SourceMapSource(
                codeString,
                asset.name,
                JSON.parse(result.map!.toString()),
                sourceAsString,
                map,
                true,
              )
            : new RawSource(codeString),
          {
            ...asset.info,
            minimized: true,
          },
        );
      }),
    );
  }
}

export default LightningCSSMinifyPlugin;
