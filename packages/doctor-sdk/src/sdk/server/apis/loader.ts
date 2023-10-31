import { SDK } from '@rsbuild/doctor-types';
import type { RawSourceMap } from 'source-map';
import { BaseAPI } from './base';
import { Router } from '../router';

export class LoaderAPI extends BaseAPI {
  /** report loader data api */
  @Router.post(SDK.ServerAPI.API.ReportLoader)
  public async reportLoader(): Promise<
    SDK.ServerAPI.InferResponseType<SDK.ServerAPI.API.ReportLoader>
  > {
    const { req, sdk } = this.ctx;
    const { body } = req;

    sdk.reportLoader(body as SDK.LoaderData);

    return 'ok';
  }

  /** report sourcemap data api */
  @Router.post(SDK.ServerAPI.API.ReportSourceMap)
  public async reportSourceMap(): Promise<
    SDK.ServerAPI.InferResponseType<SDK.ServerAPI.API.ReportLoader>
  > {
    const {
      req: { body },
      sdk,
    } = this.ctx;
    sdk.reportSourceMap(body as RawSourceMap);
    return 'ok';
  }

  @Router.post(SDK.ServerAPI.API.GetLoaderNames)
  public async getLoaderNames(): Promise<
    SDK.ServerAPI.InferResponseType<SDK.ServerAPI.API.GetLoaderNames>
  > {
    return this.dataLoader.loadAPI(SDK.ServerAPI.API.GetLoaderNames);
  }

  @Router.post(SDK.ServerAPI.API.GetLoaderChartData)
  public async getLoaderChartData(): Promise<
    SDK.ServerAPI.InferResponseType<SDK.ServerAPI.API.GetLoaderChartData>
  > {
    return this.dataLoader.loadAPI(SDK.ServerAPI.API.GetLoaderChartData);
  }

  @Router.post(SDK.ServerAPI.API.GetLoaderFileTree)
  public async getLoaderFileTree(): Promise<
    SDK.ServerAPI.InferResponseType<SDK.ServerAPI.API.GetLoaderFileTree>
  > {
    return this.dataLoader.loadAPI(SDK.ServerAPI.API.GetLoaderFileTree);
  }

  @Router.post(SDK.ServerAPI.API.GetLoaderFileDetails)
  public async getLoaderFileDetails(): Promise<
    SDK.ServerAPI.InferResponseType<SDK.ServerAPI.API.GetLoaderFileDetails>
  > {
    const { req } = this.ctx;
    const { path } =
      req.body as SDK.ServerAPI.InferRequestBodyType<SDK.ServerAPI.API.GetLoaderFileDetails>;

    return this.dataLoader.loadAPI(SDK.ServerAPI.API.GetLoaderFileDetails, {
      path,
    });
  }

  @Router.post(SDK.ServerAPI.API.GetLoaderFolderStatistics)
  public async getLoaderFolderStatistics(): Promise<
    SDK.ServerAPI.InferResponseType<SDK.ServerAPI.API.GetLoaderFolderStatistics>
  > {
    const { req } = this.ctx;
    const { folder } =
      req.body as SDK.ServerAPI.InferRequestBodyType<SDK.ServerAPI.API.GetLoaderFolderStatistics>;

    return this.dataLoader.loadAPI(
      SDK.ServerAPI.API.GetLoaderFolderStatistics,
      { folder },
    );
  }

  @Router.post(SDK.ServerAPI.API.GetLoaderFileFirstInput)
  public async getLoaderFileFirstInput(): Promise<
    SDK.ServerAPI.InferResponseType<SDK.ServerAPI.API.GetLoaderFileFirstInput>
  > {
    const { req } = this.ctx;
    const { file } =
      req.body as SDK.ServerAPI.InferRequestBodyType<SDK.ServerAPI.API.GetLoaderFileFirstInput>;

    return this.dataLoader.loadAPI(SDK.ServerAPI.API.GetLoaderFileFirstInput, {
      file,
    });
  }

  @Router.post(SDK.ServerAPI.API.GetLoaderFileInputAndOutput)
  public async getLoaderFileInputAndOutput(): Promise<
    SDK.ServerAPI.InferResponseType<SDK.ServerAPI.API.GetLoaderFileInputAndOutput>
  > {
    const { req } = this.ctx;
    const { file, loader, loaderIndex } =
      req.body as SDK.ServerAPI.InferRequestBodyType<SDK.ServerAPI.API.GetLoaderFileInputAndOutput>;

    return this.dataLoader.loadAPI(
      SDK.ServerAPI.API.GetLoaderFileInputAndOutput,
      { file, loader, loaderIndex },
    );
  }

  @Router.post(SDK.ServerAPI.API.GetTileReportHtml)
  public async getTileReportHtml(): Promise<
    SDK.ServerAPI.InferResponseType<SDK.ServerAPI.API.GetTileReportHtml>
  > {
    return this.dataLoader.loadAPI(SDK.ServerAPI.API.GetTileReportHtml, {});
  }
}
