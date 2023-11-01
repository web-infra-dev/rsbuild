import { SDK } from '@rsbuild/doctor-types';
import { BaseAPI } from './base';
import { Router } from '../router';

export class ResolverAPI extends BaseAPI {
  @Router.post(SDK.ServerAPI.API.GetResolverFileTree)
  public async getResolverFileTree(): Promise<
    SDK.ServerAPI.InferResponseType<SDK.ServerAPI.API.GetResolverFileTree>
  > {
    return this.dataLoader.loadAPI(SDK.ServerAPI.API.GetResolverFileTree);
  }

  @Router.post(SDK.ServerAPI.API.GetResolverFileDetails)
  public async getResolverFileDetails(): Promise<
    SDK.ServerAPI.InferResponseType<SDK.ServerAPI.API.GetResolverFileDetails>
  > {
    const { req } = this.ctx;
    const { filepath } =
      req.body as SDK.ServerAPI.InferRequestBodyType<SDK.ServerAPI.API.GetResolverFileDetails>;

    return this.dataLoader.loadAPI(SDK.ServerAPI.API.GetResolverFileDetails, {
      filepath,
    });
  }
}
