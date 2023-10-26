import { SDK } from '@rsbuild/doctor-types';
import { Chunk } from './chunk';

export class Asset implements SDK.AssetInstance {
  path: string;

  size: number;

  content: string;

  chunks: Chunk[];

  constructor(path: string, size: number, chunks: Chunk[], content: string) {
    this.path = path;
    this.size = size;
    this.chunks = chunks;
    this.content = content;
  }

  toData(types: SDK.ToDataType): SDK.AssetData {
    return {
      path: this.path,
      size: this.size,
      chunks: this.chunks?.map((ck) => ck.id),
      content: types === SDK.ToDataType.LiteAndNoAsset ? '' : this.content,
    };
  }
}
