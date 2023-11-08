import { EmoCheckData } from '../emo';
import { LoaderData } from './loader';
import { ModuleGraphData, ModuleCodeData } from './module';
import { ChunkGraphData } from './chunk';
import { ResolverData } from './resolver';
import { PluginData } from './plugin';
import { SummaryData } from './summary';
import { ConfigData } from './config';
import { RuleStoreData } from '../rule';
import { EnvInfo } from './envinfo';
import { PackageGraphData, OtherReports } from './package';

export type ErrorsData = RuleStoreData;

interface StoreCommonData {
  hash: string;
  root: string;
  pid: number;
  envinfo: EnvInfo;
}

export interface BuilderStoreData extends StoreCommonData {
  [key: string]: any;
  errors: ErrorsData;
  configs: ConfigData;
  summary: SummaryData;
  resolver: ResolverData;
  loader: LoaderData;
  plugin: PluginData;
  moduleGraph: ModuleGraphData;
  chunkGraph: ChunkGraphData;
  packageGraph: PackageGraphData;
  moduleCodeMap: ModuleCodeData;
  otherReports?: OtherReports | undefined;
}

export interface EMOStoreData extends StoreCommonData {
  emoCheck: EmoCheckData;
}

/**
 * @deprecated
 */
export interface StoreData
  extends Partial<Omit<EMOStoreData, keyof StoreCommonData>>,
    BuilderStoreData {}
