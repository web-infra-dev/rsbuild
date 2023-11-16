import { Chunks } from '@rsbuild/doctor-core/common-utils';
import { InternalBasePlugin } from '@rsbuild/doctor-core/plugins';
import { Manifest } from '@rsbuild/doctor-types';
import type { Compilation, Compiler } from 'webpack';

export class InternalBundlePlugin<
  T extends Compiler,
> extends InternalBasePlugin<T> {
  public readonly name = 'bundle';

  public map: Map<string, { content: string }> = new Map();

  public apply(compiler: T) {
    // bundle depends on module graph
    this.scheduler.ensureModulesChunksGraphApplied(compiler);
    compiler.hooks.compilation.tap(this.tapPostOptions, this.thisCompilation);
    compiler.hooks.done.tapPromise(this.tapPreOptions, this.done.bind(this));
  }

  public ensureAssetContent(name: string) {
    const asset = this.map.get(name);
    if (asset) return asset;
    const v = { content: '' };
    this.map.set(name, v);
    return v;
  }

  public thisCompilation = (compilation: Compilation) => {
    // save asset content to map
    if (
      compilation.hooks.processAssets &&
      compilation.hooks.afterOptimizeAssets
    ) {
      compilation.hooks.afterOptimizeAssets.tap(
        this.tapPostOptions,
        (assets) => {
          Object.keys(assets).forEach((file) => {
            const v = this.ensureAssetContent(file);
            v.content = assets[file].source().toString();
          });
        },
      );
    } else {
      compilation.hooks.afterOptimizeChunkAssets.tap(
        this.tapPostOptions,
        (chunks) => {
          [...chunks]
            .reduce<string[]>((t, chunk) => t.concat([...chunk.files]), [])
            .forEach((file) => {
              const v = this.ensureAssetContent(file);
              v.content = compilation.assets[file].source().toString();
            });
        },
      );
    }
  };

  public done = async (): Promise<void> => {
    Chunks.assetsContents(this.map, this.scheduler.chunkGraph);

    this.sdk.addClientRoutes([
      Manifest.DoctorManifestClientRoutes.ModuleGraph,
      Manifest.DoctorManifestClientRoutes.BundleSize,
    ]);
  };
}
