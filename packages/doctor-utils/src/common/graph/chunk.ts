import { SDK } from '@rsbuild/doctor-types';

export function getChunkIdsByAsset(asset: SDK.AssetData): string[] {
  if (asset.chunks) {
    return asset.chunks;
  }

  return [];
}

export function getChunksByModule(
  module: SDK.ModuleData,
  chunks: SDK.ChunkData[],
): SDK.ChunkData[] {
  if (module.chunks.length) {
    return getChunksByChunkIds(module.chunks, chunks);
  }
  return [];
}

export function getChunkByChunkId(
  chunkId: string,
  chunks: SDK.ChunkData[],
): SDK.ChunkData {
  return chunks.find((e) => e.id === chunkId)!;
}

export function getChunksByChunkIds(
  chunkIds: string[],
  chunks: SDK.ChunkData[],
): SDK.ChunkData[] {
  if (chunkIds.length) {
    return chunkIds.map((id) => getChunkByChunkId(id, chunks)).filter(Boolean);
  }
  return [];
}

export function getChunksByAsset(
  asset: SDK.AssetData,
  chunks: SDK.ChunkData[],
): SDK.ChunkData[] {
  return getChunksByChunkIds(getChunkIdsByAsset(asset), chunks);
}

export function getChunksByModuleId(
  id: number,
  modules: SDK.ModuleData[],
  chunks: SDK.ChunkData[],
) {
  const mod = modules.find((e) => e.id === id);
  if (!mod) return [];
  return getChunksByModule(mod, chunks);
}
