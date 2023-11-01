import { SDK } from '@rsbuild/doctor-types';
import ip from 'ip';
import { BaseAPI } from './base';
import { Router } from '../router';

export class ProjectAPI extends BaseAPI {
  @Router.get(SDK.ServerAPI.API.Env)
  public async env(): Promise<
    SDK.ServerAPI.InferResponseType<SDK.ServerAPI.API.Env>
  > {
    const { server } = this.ctx;

    return {
      ip: ip.address(),
      port: server.port,
    };
  }

  @Router.get(SDK.ServerAPI.API.Manifest)
  public async manifest(): Promise<
    SDK.ServerAPI.InferResponseType<SDK.ServerAPI.API.Manifest>
  > {
    const { sdk } = this.ctx;
    const data = sdk.getManifestData();
    return JSON.stringify(data);
  }

  @Router.post(SDK.ServerAPI.API.GetProjectInfo)
  public async getProjectInfo(): Promise<
    SDK.ServerAPI.InferResponseType<SDK.ServerAPI.API.GetProjectInfo>
  > {
    return this.dataLoader.loadAPI(SDK.ServerAPI.API.GetProjectInfo);
  }

  @Router.post(SDK.ServerAPI.API.GetClientRoutes)
  public async getClientRoutes(): Promise<
    SDK.ServerAPI.InferResponseType<SDK.ServerAPI.API.GetClientRoutes>
  > {
    return this.dataLoader.loadAPI(SDK.ServerAPI.API.GetClientRoutes);
  }
}
