import { SDK } from '@rsbuild/doctor-types';
import type { Asset } from './asset';
import type { Chunk } from './chunk';
import type { Module } from '../module-graph';
import type { EntryPoint } from './entrypoint';

export class ChunkGraph implements SDK.ChunkGraphInstance {
  private _assets: Asset[] = [];

  private _chunks: Chunk[] = [];

  private _entrypoints: EntryPoint[] = [];

  getAssets(): Asset[] {
    return this._assets.slice();
  }

  getChunks(): Chunk[] {
    return this._chunks.slice();
  }

  addAsset(...assets: Asset[]): void {
    assets.forEach((asset) => {
      if (!this._assets.includes(asset)) {
        this._assets.push(asset);
      }
    });
  }

  addChunk(...chunks: Chunk[]): void {
    chunks.forEach((chunk) => {
      if (!this._chunks.includes(chunk)) {
        this._chunks.push(chunk);
      }
    });
  }

  getChunkById(id: string): Chunk | undefined {
    return this._chunks.find((item) => item.id === id);
  }

  getChunkByModule(module: Module): Chunk | undefined {
    return this._chunks.find((item) => item.hasModule(module));
  }

  getAssetByPath(path: string): Asset | undefined {
    return this._assets.find((item) => item.path === path);
  }

  getAssetsByChunk(chunk: Chunk): Asset[] | undefined {
    return this._assets.filter((item) => {
      const _chunk = item.chunks.find((ck) => ck.id === chunk.id);
      if (_chunk) return true;
    });
  }

  getEntryPoints(): EntryPoint[] {
    return this._entrypoints.slice();
  }

  addEntryPoint(...entrypoints: EntryPoint[]): void {
    entrypoints.forEach((entrypoint) => {
      if (!this._entrypoints.includes(entrypoint)) {
        this._entrypoints.push(entrypoint);
      }
    });
  }

  /** output the chunk graph data */
  toData(type: SDK.ToDataType): SDK.ChunkGraphData {
    return {
      assets: this._assets.map((item) => item.toData(type)),
      chunks: this._chunks.map((item) => item.toData()),
      entrypoints: this._entrypoints.map((item) => item.toData()),
    };
  }
}
