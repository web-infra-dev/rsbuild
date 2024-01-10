import { Buffer } from 'buffer';
import type { webpack } from '@rsbuild/webpack';
import Codecs from './shared/codecs';
import type { FinalOptions } from './types';

export const IMAGE_MINIMIZER_PLUGIN_NAME =
  '@rsbuild/plugin-image-compress/minimizer' as const;

export interface MinimizedResult {
  source: webpack.sources.RawSource;
}

export class ImageMinimizerPlugin {
  name = IMAGE_MINIMIZER_PLUGIN_NAME;

  options: FinalOptions;

  constructor(options: FinalOptions) {
    this.options = options;
  }

  async optimize(
    compiler: webpack.Compiler,
    compilation: webpack.Compilation,
    assets: Record<string, webpack.sources.Source>,
  ): Promise<void> {
    const cache = compilation.getCache(IMAGE_MINIMIZER_PLUGIN_NAME);
    const { RawSource } = compiler.webpack.sources;
    const { matchObject } = compiler.webpack.ModuleFilenameHelpers;

    const buildError = (error: unknown, file?: string, context?: string) => {
      const cause = error instanceof Error ? error : new Error();
      const message =
        file && context
          ? `"${file}" in "${context}" from Image Minimizer:\n${cause.message}`
          : cause.message;
      const ret = new compiler.webpack.WebpackError(message);

      if (error instanceof Error) {
        (ret as any).error = error;
      }

      return ret;
    };

    const codec = Codecs[this.options.use];
    if (!codec) {
      compilation.errors.push(
        buildError(new Error(`Codec ${this.options.use} is not supported`)),
      );
    }
    const opts = { ...codec.defaultOptions, ...this.options };

    const handleAsset = async (name: string) => {
      const info = compilation.getAsset(name)?.info;
      const fileName = name.split('?')[0];

      // 1. Skip double minimize assets from child compilation
      // 2. Test file by options (e.g. test, include, exclude)
      if (info?.minimized || !matchObject(opts, fileName)) {
        return;
      }

      const { source: inputSource } = compilation.getAsset(name)!;

      const eTag = cache.getLazyHashedEtag(inputSource);
      const cacheItem = cache.getItemCache(name, eTag);
      let result = await cacheItem.getPromise<MinimizedResult | undefined>();

      try {
        if (!result) {
          const input = inputSource.source();
          const buf = await codec.handler(Buffer.from(input), opts);
          result = { source: new RawSource(buf) };
          await cacheItem.storePromise(result);
        }
        compilation.updateAsset(name, result.source, { minimized: true });
      } catch (error) {
        compilation.errors.push(buildError(error, name, compiler.context));
      }
    };
    const promises = Object.keys(assets).map((name) => handleAsset(name));
    await Promise.all(promises);
  }

  apply(compiler: webpack.Compiler) {
    const handleCompilation = (compilation: webpack.Compilation) => {
      compilation.hooks.processAssets.tapPromise(
        {
          name: this.name,
          stage:
            compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE,
          additionalAssets: true,
        },
        (assets) => this.optimize(compiler, compilation, assets),
      );

      compilation.hooks.statsPrinter.tap(this.name, (stats) => {
        stats.hooks.print
          .for('asset.info.minimized')
          .tap(
            '@rsbuild/plugin-image-compress',
            (minimized, { green, formatFlag }) =>
              minimized && green && formatFlag
                ? green(formatFlag('minimized'))
                : '',
          );
      });
    };
    compiler.hooks.compilation.tap(this.name, handleCompilation);
  }
}
