import { SDK } from '@rsbuild/doctor-types';
import { BaseAPI } from './base';
import { Router } from '../router';

export class GraphAPI extends BaseAPI {
  @Router.post(SDK.ServerAPI.API.GetAssetsSummary)
  public async getAssetsSummary(): Promise<
    SDK.ServerAPI.InferResponseType<SDK.ServerAPI.API.GetAssetsSummary>
  > {
    const { req } = this.ctx;
    const { withFileContent } =
      req.body as SDK.ServerAPI.InferRequestBodyType<SDK.ServerAPI.API.GetAssetsSummary>;

    return this.dataLoader.loadAPI(SDK.ServerAPI.API.GetAssetsSummary, {
      withFileContent,
    });
  }

  @Router.post(SDK.ServerAPI.API.GetAssetDetails)
  public async getModuleGraphForAsset(): Promise<
    SDK.ServerAPI.InferResponseType<SDK.ServerAPI.API.GetAssetDetails>
  > {
    const { req } = this.ctx;

    const { assetPath } =
      req.body as SDK.ServerAPI.InferRequestBodyType<SDK.ServerAPI.API.GetAssetDetails>;

    return this.dataLoader.loadAPI(SDK.ServerAPI.API.GetAssetDetails, {
      assetPath,
    });
  }

  @Router.post(SDK.ServerAPI.API.GetChunksByModuleId)
  public async getChunksByModuleId(): Promise<
    SDK.ServerAPI.InferResponseType<SDK.ServerAPI.API.GetChunksByModuleId>
  > {
    const { req } = this.ctx;

    const { moduleId } =
      req.body as SDK.ServerAPI.InferRequestBodyType<SDK.ServerAPI.API.GetChunksByModuleId>;

    return this.dataLoader.loadAPI(SDK.ServerAPI.API.GetChunksByModuleId, {
      moduleId,
    });
  }

  @Router.post(SDK.ServerAPI.API.GetModuleDetails)
  public async getModuleDetails(): Promise<
    SDK.ServerAPI.InferResponseType<SDK.ServerAPI.API.GetModuleDetails>
  > {
    const { req } = this.ctx;

    const { moduleId } =
      req.body as SDK.ServerAPI.InferRequestBodyType<SDK.ServerAPI.API.GetModuleDetails>;

    return this.dataLoader.loadAPI(SDK.ServerAPI.API.GetModuleDetails, {
      moduleId,
    });
  }

  @Router.post(SDK.ServerAPI.API.GetModulesByModuleIds)
  public async getDependencyByResolvedRequest(): Promise<
    SDK.ServerAPI.InferResponseType<SDK.ServerAPI.API.GetModulesByModuleIds>
  > {
    const { req } = this.ctx;

    const { moduleIds = [] } =
      req.body as SDK.ServerAPI.InferRequestBodyType<SDK.ServerAPI.API.GetModulesByModuleIds>;

    return this.dataLoader.loadAPI(SDK.ServerAPI.API.GetModulesByModuleIds, {
      moduleIds,
    });
  }

  @Router.post(SDK.ServerAPI.API.GetModuleCodeByModuleId)
  public async getModuleCodeByModuleId(): Promise<
    SDK.ServerAPI.InferResponseType<SDK.ServerAPI.API.GetModuleCodeByModuleId>
  > {
    const { req } = this.ctx;

    const { moduleId } =
      req.body as SDK.ServerAPI.InferRequestBodyType<SDK.ServerAPI.API.GetModuleCodeByModuleId>;

    return this.dataLoader.loadAPI(SDK.ServerAPI.API.GetModuleCodeByModuleId, {
      moduleId,
    });
  }

  @Router.post(SDK.ServerAPI.API.GetModuleCodeByModuleIds)
  public async getModuleCodeByModuleIds(): Promise<
    SDK.ServerAPI.InferResponseType<SDK.ServerAPI.API.GetModuleCodeByModuleIds>
  > {
    const { req } = this.ctx;

    const { moduleIds } =
      req.body as SDK.ServerAPI.InferRequestBodyType<SDK.ServerAPI.API.GetModuleCodeByModuleIds>;

    return this.dataLoader.loadAPI(SDK.ServerAPI.API.GetModuleCodeByModuleIds, {
      moduleIds,
    });
  }

  @Router.post(SDK.ServerAPI.API.GetEntryPoints)
  public async getEntryModulesSummary(): Promise<
    SDK.ServerAPI.InferResponseType<SDK.ServerAPI.API.GetEntryPoints>
  > {
    return this.dataLoader.loadAPI(SDK.ServerAPI.API.GetEntryPoints);
  }
}
