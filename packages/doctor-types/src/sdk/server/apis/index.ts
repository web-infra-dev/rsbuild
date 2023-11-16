import { ServerResponse } from 'http';
import { SDK } from 'src';
import { PlainObject, Get } from '../../../common';
import { connect } from '../../../thirdparty';
import { DoctorBuilderSDKInstance } from '../../index';
import { DoctorServerInstance } from '../index';
import { LoaderData } from '../../loader';
import { ProjectAPIResponse, ProjectAPIResquestBody } from './project';
import { LoaderAPIResponse, LoaderAPIResquestBody } from './loader';
import { ResolverAPIResponse, ResolverAPIResquestBody } from './resolver';
import { PluginAPIResponse, PluginAPIResquestBody } from './plugin';
import { GraphAPIResponse, GraphAPIResquestBody } from './graph';
import { AlertsAPIResponse, AlertsAPIResquestBody } from './alerts';
import { DoctorManifestMappingKeys } from '../../../manifest';

export * from './pagination';

export enum API {
  ApplyErrorFix = '/api/apply/error/fix',
  Env = '/api/env',
  EntryHtml = '/index.html',
  Manifest = '/api/manifest.json',

  LoadDataByKey = '/api/data/key',

  SendAPIDataToClient = '/api/socket/send',

  /** Project API */
  GetProjectInfo = '/api/project/info',
  GetClientRoutes = '/api/routes',

  /** Loader API */
  ReportLoader = '/api/loader/report',
  GetLoaderNames = '/api/loader/names',
  GetLoaderChartData = '/api/loader/chart/data',
  GetLoaderFileTree = '/api/loader/filetree',
  GetLoaderFileDetails = '/api/loader/file',
  GetLoaderFolderStatistics = '/api/loader/folder/statics',
  GetLoaderFileFirstInput = '/api/loader/input',
  GetLoaderFileInputAndOutput = '/api/loader/inputandoutput',

  /** SourceMap API */
  ReportSourceMap = '/api/sourcemap/report',

  /** Resolver API */
  GetResolverFileTree = '/api/resolver/filetree',
  GetResolverFileDetails = '/api/resolver/file',

  /** Plugin API */
  GetPluginSummary = '/api/plugins/summary',
  GetPluginData = '/api/plugins/data',

  /** Graph API */
  GetAssetsSummary = '/api/graph/assets/summary',
  GetAssetDetails = '/api/graph/asset/details',
  GetChunksByModuleId = '/api/graph/chunk/module',
  GetModuleDetails = '/api/graph/module/details',
  GetModulesByModuleIds = '/api/graph/modules/ids',
  GetEntryPoints = '/api/graph/entrypoints',
  GetModuleCodeByModuleId = '/api/graph/module/code',
  GetModuleCodeByModuleIds = '/api/graph/module/codes',
  GetAllModuleGraph = '/api/graph/module/all',
  GetAllChunkGraph = '/api/graph/chunk/all',

  /** Alerts API */
  GetPackageRelationAlertDetails = '/api/alerts/details/package/relation',
  GetOverlayAlerts = '/api/alerts/overlay',

  /** BundleDiff API */
  BundleDiffManifest = '/api/bundle_diff/manifest.json',
  GetBundleDiffSummary = '/api/bundle_diff/summary',

  GetTileReportHtml = '/api/tile/report',
}

/**
 * api which used outside the sdk.
 */
export enum APIExtends {
  GetCompileProgess = '/api/progress',
}

export interface SocketResponseType<T extends API | APIExtends = API> {
  /**
   * use to match for the event listener when there are different request body.
   */
  req: {
    api: T;
    body: InferRequestBodyType<T>;
  };
  /**
   * api response
   */
  res: InferResponseType<T>;
}

export interface ResponseTypes
  extends LoaderAPIResponse,
    ResolverAPIResponse,
    PluginAPIResponse,
    GraphAPIResponse,
    AlertsAPIResponse,
    ProjectAPIResponse {
  [API.ReportLoader]: 'ok';
  [API.EntryHtml]: string;
  [API.Manifest]: string;
  [API.ApplyErrorFix]: 'success';
  [API.LoadDataByKey]: unknown;
  [API.BundleDiffManifest]: SDK.BuilderStoreData;
  [API.GetBundleDiffSummary]: {
    root: string;
    hash: string;
    outputFilename: string;
    errors: SDK.ErrorsData;
    chunkGraph: SDK.ChunkGraphData;
    moduleGraph: SDK.ModuleGraphData;
    packageGraph: SDK.PackageGraphData;
    moduleCodeMap: SDK.ModuleCodeData;
  };
  [API.GetModuleCodeByModuleId]: SDK.ModuleSource;
  [API.GetModuleCodeByModuleIds]: SDK.ModuleCodeData;
  [API.GetAllModuleGraph]: SDK.ModuleGraphData;
  [API.GetAllChunkGraph]: SDK.ChunkGraphData;
}

export interface ResquestBodyTypes
  extends LoaderAPIResquestBody,
    ResolverAPIResquestBody,
    PluginAPIResquestBody,
    GraphAPIResquestBody,
    AlertsAPIResquestBody,
    ProjectAPIResquestBody {
  [API.ReportLoader]: LoaderData;
  [API.SendAPIDataToClient]: {
    api: API;
    data: unknown;
  };
  [API.LoadDataByKey]: {
    /**
     * @example 'plugin'
     * @example 'moduleGraph.modules'
     */
    key: DoctorManifestMappingKeys;
  };
}

export type InferResponseType<T, F = void> = Get<ResponseTypes, T, F>;

export type InferRequestBodyType<T, F = void> = Get<ResquestBodyTypes, T, F>;

export interface APIContext {
  server: DoctorServerInstance;
  sdk: DoctorBuilderSDKInstance;
  req: connect.IncomingMessage & { body?: PlainObject };
  res: ServerResponse;
}
