import type { NonFunctionProperties } from '../common';
import type { ModuleInstance, ToDataType } from './module';

export interface AssetInstance {
  path: string;
  size: number;
  /** File belongs to Chunk */
  chunks: ChunkInstance[];
  /** File resource content */
  content: string;
  /** Generate data */
  toData(type: ToDataType): AssetData;
}

export interface ChunkInstance {
  /** Chunk Identifier */
  id: string;
  /** Chunk Name */
  name: string;
  /** Whether to load on the homepage */
  initial: boolean;
  size: number;
  /** Is it an entrance */
  entry: boolean;

  /** Is it the entrance Chunk */
  isEntry(): boolean;
  /** Is the module a Chunk entrance */
  isChunkEntryModule(module: ModuleInstance): boolean;
  /** Does it contain modules */
  hasModule(module: ModuleInstance): boolean;
  /** Connection module */
  addModule(module: ModuleInstance): void;
  addAsset(asset: AssetInstance): void;
  /** Add Dependency Chunk */
  addDependency(dep: ChunkInstance): void;
  /** Add Dependent Chunk */
  addImported(imported: ChunkInstance): void;
  /** Includes products */
  getAssets(): AssetInstance[];
  /** Contains original modules */
  getModules(): ModuleInstance[];
  /** Depends on Chunk */
  getDependencies(): ChunkInstance[];
  /** Add Dependent Chunk  */
  getImported(): ChunkInstance[];
  /** add parsed chunk size */
  setParsedSize(size: number): void;
  /** Generate data */
  toData(): ChunkData;
}

export interface ChunkGraphInstance {
  /** Obtain product data */
  getAssets(): AssetInstance[];
  /** Get Chunk Data */
  getChunks(): ChunkInstance[];
  /** Add product data */
  addAsset(...assets: AssetInstance[]): void;
  /** Add Chunk Data */
  addChunk(...chunks: ChunkInstance[]): void;
  /** Get chunk by identifier */
  getChunkById(id: string): ChunkInstance | undefined;
  /** Get Chunk by Module */
  getChunkByModule(module: ModuleInstance): ChunkInstance | undefined;
  /** Get the file according to the path */
  getAssetByPath(path: string): AssetInstance | undefined;
  /** Get files based on Chunk */
  getAssetsByChunk(chunk: ChunkInstance): AssetInstance[] | undefined;
  /**
   * get the list of entry points
   */
  getEntryPoints(): EntryPointInstance[];
  /**
   * add the entry point instance to chunk graph
   */
  addEntryPoint(...entrypoint: EntryPointInstance[]): void;
  /** Output pure data */
  toData(type: ToDataType): ChunkGraphData;
}

export interface AssetData
  extends Omit<NonFunctionProperties<AssetInstance>, 'chunks'> {
  /** Chunk Identifier to which the file belongs */
  chunks: string[];
}

export interface ChunkGraphData
  extends NonFunctionProperties<ChunkGraphInstance> {
  assets: AssetData[];
  chunks: ChunkData[];
  entrypoints: EntryPointData[];
}

export interface ChunkData
  extends Omit<
    NonFunctionProperties<ChunkInstance>,
    'assets' | 'modules' | 'dependencies' | 'imported'
  > {
  /** Is it the entrance Chunk */
  entry: boolean;
  /** Contains product path */
  assets: string[];
  /** contains the original module identifier */
  modules: number[];
  /** Depends on Chunk Identifier */
  dependencies: string[];
  /** Dependent Chunk Identifier */
  imported: string[];
  /** chunk parsed size */
  parsedSize: number;
}

export interface EntryPointInstance {
  name: string;
  /**
   * add asset which contained in this entry point
   */
  addAsset(asset: AssetInstance): void;
  /**
   * add chunk which contained in this entry point
   */
  addChunk(chunk: ChunkInstance): void;
  toData(): EntryPointData;
}

export interface EntryPointData
  extends NonFunctionProperties<EntryPointInstance> {
  /**
   * id list for chunks which contained in this entry point.
   */
  chunks: ChunkData['id'][];
  /**
   * path list for assets which contained in this entry point.
   */
  assets: AssetData['path'][];
  /**
   * total size of assets
   */
  size: number;
}
