import { SDK } from '@rsbuild/doctor-types';
import { BaseAPI } from './base';
import { Router } from '../router';

export class PluginAPI extends BaseAPI {
  @Router.post(SDK.ServerAPI.API.GetPluginSummary)
  public async getPluginSummary(): Promise<
    SDK.ServerAPI.InferResponseType<SDK.ServerAPI.API.GetPluginSummary>
  > {
    return this.dataLoader.loadAPI(SDK.ServerAPI.API.GetPluginSummary);
  }

  @Router.post(SDK.ServerAPI.API.GetPluginData)
  public async getPluginData(): Promise<
    SDK.ServerAPI.InferResponseType<SDK.ServerAPI.API.GetPluginData>
  > {
    const { req } = this.ctx;
    const { hooks = [], tapNames = [] } =
      req.body as SDK.ServerAPI.InferRequestBodyType<SDK.ServerAPI.API.GetPluginData>;

    return this.dataLoader.loadAPI(SDK.ServerAPI.API.GetPluginData, {
      hooks,
      tapNames,
    });
  }
}
