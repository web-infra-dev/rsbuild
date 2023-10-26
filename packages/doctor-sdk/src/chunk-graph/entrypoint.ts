import { SDK } from '@rsbuild/doctor-types';
import type { Asset } from './asset';
import type { Chunk } from './chunk';

export class EntryPoint implements SDK.EntryPointInstance {
  constructor(public readonly name: string) {}

  private _chunks: Chunk[] = [];

  private _assets: Asset[] = [];

  public addChunk(chunk: Chunk): void {
    if (this._chunks.includes(chunk)) return;
    this._chunks.push(chunk);
  }

  public addAsset(asset: Asset): void {
    if (this._assets.includes(asset)) return;
    this._assets.push(asset);
  }

  public toData(): SDK.EntryPointData {
    return {
      name: this.name,
      chunks: this._chunks.map((e) => e.id),
      assets: this._assets.map((e) => e.path),
      size: this._assets.length
        ? this._assets.reduce((t, e) => t + e.size, 0)
        : 0,
    };
  }
}
