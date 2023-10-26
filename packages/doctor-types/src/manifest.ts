import { PlainObject, ObjectPropertyNames } from './common';
import { StoreData } from './sdk';

export interface DoctorManifest {
  client: DoctorManifestClient;
  data: DoctorManifestData;
  /**
   * manifest url in tos
   */
  cloudManifestUrl?: string;
  /**
   * manifest data shareding file urls in tos
   */
  cloudData?: Record<keyof DoctorManifestData, string[] | string>;
  /** current build name */
  name?: string;
  /**
   * multiple build info
   */
  series?: DoctorManifestSeriesData[];
}

export interface DoctorManifestSeriesData {
  name: string;
  path: string;
  cloudUrl: string;
  stage: number;
  origin?: string;
}

export interface DoctorManifestWithShardingFiles
  extends Omit<DoctorManifest, 'data'> {
  data: Record<keyof DoctorManifestData, string[] | string>;
  /**
   * local server will proxy the manifest content and inject `__LOCAL__SERVER__: true`
   */
  __LOCAL__SERVER__?: boolean;
  __SOCKET__URL__?: string;
}

export interface DoctorManifestClient {
  enableRoutes: DoctorManifestClientRoutes[];
}

export interface DoctorManifestData extends StoreData {}

export enum DoctorManifestClientRoutes {
  Overall = 'Overall',
  WebpackLoaders = 'Compile.WebpackLoaders',
  ModuleResolve = 'Compile.ModuleResolve',
  WebpackPlugins = 'Compile.WebpackPlugins',
  BundleSize = 'Bundle.BundleSize',
  ModuleGraph = 'Bundle.ModuleGraph',
  TreeShaking = 'Bundle.TreeShaking',
  EmoCheck = 'Emo.Check',
}

export enum DoctorManifestClientConstant {
  WindowPropertyForManifestUrl = '__DEVTOOLS_MANIFEST_URL__',
}

export type DoctorManifestObjectKeys = NonNullable<
  ObjectPropertyNames<DoctorManifestData>
>;

export type DoctorManifestRootKeys = keyof DoctorManifestData;

export type DoctorManifestMappingKeys =
  | {
      [K in DoctorManifestObjectKeys]: DoctorManifestData[K] extends PlainObject
        ? DoctorManifestData[K] extends Array<unknown>
          ? never
          : string extends keyof DoctorManifestData[K]
          ? never
          : keyof DoctorManifestData[K] extends string
          ? `${K}.${keyof DoctorManifestData[K]}`
          : never
        : never;
    }[DoctorManifestObjectKeys]
  | DoctorManifestRootKeys;

export type InferManifestDataValue<T> =
  T extends `${infer Scope}.${infer Child}`
    ? Scope extends DoctorManifestObjectKeys
      ? Child extends keyof DoctorManifestData[Scope]
        ? DoctorManifestData[Scope][Child]
        : never
      : never
    : T extends DoctorManifestRootKeys
    ? DoctorManifestData[T]
    : never;

export interface ManifestDataLoader {
  loadManifest(): Promise<DoctorManifest | DoctorManifestWithShardingFiles>;
  loadData: {
    <T extends DoctorManifestMappingKeys>(
      key: T,
    ): Promise<void | InferManifestDataValue<T>>;
  };
}
