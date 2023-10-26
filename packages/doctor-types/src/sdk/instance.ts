import type { Configuration } from 'webpack';
import type { SourceMapConsumer, RawSourceMap } from 'source-map';

import { LoaderData } from './loader';
import { ResolverData } from './resolver';
import { PluginData } from './plugin';
import { BuilderStoreData, EMOStoreData, StoreData } from './result';
import { ModuleGraphInstance } from './module';
import {
  DoctorManifestClientRoutes,
  DoctorManifestWithShardingFiles,
} from '../manifest';
import { SummaryData } from './summary';
import { RuntimeContext, RuntimeContextOptions } from './context';
import { DoctorServerInstance } from './server';
import { PlainObject } from '../common';
import { EmoCheckData } from '../emo';
import { Hooks } from './hooks';

export type WriteStoreOptionsType = { userManifestCloudName?: string };
export interface DoctorBuilderSDKInstance extends DoctorSDKInstance {
  readonly server: DoctorServerInstance;
  /** Report configuration information */
  reportConfiguration(config: Configuration): void;
  /** Report error message */
  reportError(errors: Error[]): void;
  /** Report error message */
  reportLoader(data: LoaderData): void;
  /** Report path request information */
  reportResolver(data: ResolverData): void;
  /** Report plugin information */
  reportPlugin(data: PluginData): void;
  /** Report module chart data */
  reportModuleGraph(data: ModuleGraphInstance): void;
  /** report the data of summary */
  reportSummaryData(part: Partial<SummaryData>): void;
  /** Report sourceMap data */
  reportSourceMap(data: RawSourceMap): void;
  /** report tile graph like webpack bundle analyzer data */
  reportTileHtml(data: string): void;

  getClientRoutes(): DoctorManifestClientRoutes[];
  addClientRoutes(routes: DoctorManifestClientRoutes[]): void;

  /** Application error modification */
  applyErrorFix(id: number): Promise<void>;
  /** Get build result data */
  getStoreData(): BuilderStoreData;
  /** Get build resource entry file */
  getManifestData(): DoctorManifestWithShardingFiles;
  /** Get rule context */
  getRuleContext(options: RuntimeContextOptions): RuntimeContext;
  /** Get SourceMap from cache */
  getSourceMap(file: string): Promise<SourceMapConsumer | undefined>;
  /** clear cache */
  clearSourceMapCache(): void;
  /** Clear all data */
  clear(): void;
}

export interface DoctorEMOSDKInstance extends DoctorSDKInstance {
  reportEmoData(data: EmoCheckData): void;
  getStoreData(): EMOStoreData;
}

export interface DoctorSDKInstance {
  readonly name: string;
  readonly root: string;
  readonly extraConfig: SDKOptionsType | undefined;
  readonly hooks: Hooks;

  /**
   * folder of manifest
   *   - used to save the manifest.json and sharding files.
   * @default ".web-doctor"
   */
  readonly outputDir: string;

  /** manifest cloud path */
  cloudManifestUrl: string;

  /** manifest local path */
  diskManifestPath: string;

  /** start */
  bootstrap(): Promise<void>;
  dispose(): Promise<void>;

  /** Change output path */
  setOutputDir(outputDir: string): void;

  /** Change build name */
  setName(name: string): void;
  setHash(hash: string): void;

  /**
   * write the manifest to a folder
   *   - use this.outputDir
   * @returns the absolute path of manifest.json.
   */
  saveManifest(
    storeData: PlainObject,
    options: WriteStoreOptionsType,
  ): Promise<string>;
}

export type SDKOptionsType = { disableTOSUpload: boolean };

/**
 * @deprecated
 */
export interface DoctorSdkInstance {
  readonly name: string;
  readonly root: string;
  readonly server: DoctorServerInstance;

  /**
   * folder of manifest
   *   - used to save the manifest.json and sharding files.
   * @default ".web-doctor"
   */
  readonly outputDir: string;

  /** manifest cloud path */
  cloudManifestUrl: string;

  /** manifest local path */
  diskManifestPath: string;

  /** start */
  bootstrap(): Promise<void>;

  /** Close */
  dispose(): Promise<void>;

  /** Clear all data */
  clear(): void;

  /** Change output path */
  setOutputDir(outputDir: string): void;

  /** Change build name */
  setName(name: string): void;

  /** Report configuration information */
  reportConfiguration(config: Configuration): void;

  /** Report error message */
  reportError(errors: Error[]): void;

  /** Report error message */
  reportLoader(data: LoaderData): void;

  /** Report path request information */
  reportResolver(data: ResolverData): void;

  /** Report plugin information */
  reportPlugin(data: PluginData): void;

  /** Report module chart data */
  reportModuleGraph(data: ModuleGraphInstance): void;
  /** report the data of summary */
  reportSummaryData(part: Partial<SummaryData>): void;

  /** Report sourceMap data */
  reportSourceMap(data: RawSourceMap): void;

  getClientRoutes(): DoctorManifestClientRoutes[];
  addClientRoutes(routes: DoctorManifestClientRoutes[]): void;

  /**
   * write the manifest to a folder
   *   - use this.outputDir
   * @returns the absolute path of manifest.json.
   */
  writeStore(options?: WriteStoreOptionsType): Promise<string>;

  /** Application error modification */
  applyErrorFix(id: number): Promise<void>;

  /** Get build result data */
  getStoreData(): StoreData;

  /** Get build resource entry file */
  getManifestData(): DoctorManifestWithShardingFiles;

  /** Get rule context */
  getRuleContext(options: RuntimeContextOptions): RuntimeContext;

  /** Get SourceMap from cache */
  getSourceMap(file: string): Promise<SourceMapConsumer | undefined>;

  /** clear cache */
  clearSourceMapCache(): void;
}
