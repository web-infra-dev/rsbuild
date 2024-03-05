// https://github.com/fz6m/lightningcss-loader/blob/main/src/minify.ts
import { transform as _transform } from 'lightningcss';
import { Buffer } from 'node:buffer';
import type { Compilation, Compiler } from 'webpack';
import type { LightningCssMinifyPluginOptions } from './types';

const PLUGIN_NAME = 'lightningcss-minify-plugin';
const CSS_FILE_REG = /\.css(?:\?.*)?$/i;

export class LightningCssMinifyPlugin {
  private readonly options: Omit<
    LightningCssMinifyPluginOptions,
    'implementation'
  >;
  private readonly transform: typeof _transform;

  constructor(opts: LightningCssMinifyPluginOptions = {}) {
    const { implementation, ...otherOpts } = opts;
    if (implementation && typeof implementation.transform !== 'function') {
      throw new TypeError(
        `[${PLUGIN_NAME}]: implementation.transform must be an 'lightningcss' transform function. Received ${typeof implementation.transform}`,
      );
    }

    this.transform = implementation?.transform ?? _transform;
    this.options = otherOpts;
  }

  apply(compiler: Compiler) {
    compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation) => {
      compilation.hooks.processAssets.tapPromise(
        {
          name: PLUGIN_NAME,
          stage: (compilation as any)?.PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE,
          additionalAssets: true,
        },
        async () => await this.transformAssets(compilation),
      );

      compilation.hooks.statsPrinter.tap(PLUGIN_NAME, (statsPrinter) => {
        statsPrinter.hooks.print
          .for('asset.info.minimized')
          // @ts-ignore
          .tap(PLUGIN_NAME, (minimized, { green, formatFlag }) => {
            // @ts-ignore
            return minimized ? green(formatFlag('minimized')) : undefined;
          });
      });
    });
  }

  private async transformAssets(compilation: Compilation): Promise<void> {
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
        CSS_FILE_REG.test(asset.name),
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
                map as any,
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

export default LightningCssMinifyPlugin;
