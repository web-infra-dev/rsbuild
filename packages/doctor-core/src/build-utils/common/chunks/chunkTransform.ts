import {
  Asset,
  Chunk,
  ChunkGraph,
  EntryPoint,
} from '@rsbuild/doctor-sdk/graph';
import { forEach } from 'lodash';
import { Plugin } from '@rsbuild/doctor-types';

const FILTER_ASSETS_TYPE = 'assets by status';

export function chunkTransform(
  assetMap: Map<string, { content: string }>,
  bundleStats: Plugin.StatsCompilation,
) {
  const chunkGraph = new ChunkGraph();

  forEach(bundleStats.chunks, (_chunk) => {
    const parsedSize = 0;

    const chunk = new Chunk(
      String(_chunk.id),
      _chunk.names?.join('') || _chunk.files?.join('| ') || '',
      _chunk.size,
      _chunk.initial,
      _chunk.entry,
    );

    chunk.setParsedSize(parsedSize);
    chunkGraph.addChunk(chunk);
  });

  forEach(bundleStats.assets, (_asset) => {
    if (_asset.type === FILTER_ASSETS_TYPE) {
      /**  Filter assets with type = 'assets by status',
       * which are the assets that are initially pushed when generating assets groups to record asset size info.
       * This feature is only available in webpack@5.xx and later versions.
       **/
      return;
    }

    const chunks =
      _asset.chunks
        ?.map((ck) => {
          const chunk = chunkGraph.getChunkById(String(ck));
          return chunk;
        })
        .filter(<T>(chunk: T): chunk is NonNullable<T> => !!chunk) || [];
    const { content = '' } = assetMap.get(_asset.name) || {};
    const asset = new Asset(_asset.name, _asset.size, chunks, content);
    chunks.forEach((chunk) => chunk?.addAsset(asset));
    chunkGraph.addAsset(asset);
  });

  // build the entrypoints in Chunk Graph
  // must called after chunk and asset created end in chunk graph!
  forEach(bundleStats.entrypoints, (_entrypoint, key) => {
    const entrypoint = new EntryPoint(_entrypoint.name || key);

    forEach(_entrypoint.chunks, (chunkId) => {
      const ck = chunkGraph.getChunkById(`${chunkId}`);
      if (ck) entrypoint.addChunk(ck);
    });
    forEach(_entrypoint.assets, (_asset) => {
      const asset = chunkGraph.getAssetByPath(_asset.name);
      if (asset) entrypoint.addAsset(asset);
    });
    chunkGraph.addEntryPoint(entrypoint);
  });

  return chunkGraph;
}
