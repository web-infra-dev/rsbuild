import { ChunkGraph } from '@rsbuild/doctor-sdk/graph';

export function assetsContents(
  assetMap: Map<string, { content: string }>,
  chunkGraph: ChunkGraph,
) {
  const assets = chunkGraph.getAssets();
  assets.forEach((asset) => {
    const { content = '' } = assetMap.get(asset.path) || {};
    asset.content = content;
  });
}
