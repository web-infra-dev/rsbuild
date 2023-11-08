import type { ChunkGraph } from '@rsbuild/doctor-sdk/graph';
import { Plugin } from '@rsbuild/doctor-types';
import { Chunks, ModuleGraph } from '..';

export async function transStats(json: Plugin.StatsCompilation) {
  const chunkGraph: ChunkGraph = Chunks.chunkTransform(new Map(), json);
  const moduleGraph = ModuleGraph.getModuleGraphByStats(json, '.', chunkGraph);
  const assetsModuleMap =
    (await Chunks.getAssetsModulesData(json, json.outputPath || '', {})) || {};
  Chunks.transformAssetsModulesData(assetsModuleMap, moduleGraph);
  return { chunkGraph, moduleGraph };
}
