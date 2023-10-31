import { Manifest, SDK } from '@rsbuild/doctor-types';
import { BaseAPI } from './base';
import { Router } from '../router';

export class DataAPI extends BaseAPI {
  @Router.post(SDK.ServerAPI.API.LoadDataByKey)
  public async loadDataByKey(): Promise<
    SDK.ServerAPI.InferResponseType<SDK.ServerAPI.API.LoadDataByKey>
  > {
    const { req } = this.ctx;
    const { url } = req;

    let { key } =
      req.body as SDK.ServerAPI.InferRequestBodyType<SDK.ServerAPI.API.LoadDataByKey>;

    // request by '/api/data/key/${dataKey}'
    // example:
    //   - '/api/data/key/envinfo'
    //   - '/api/data/key/moduleGraph'
    if (!key && url) {
      const uri = new URL(url, 'http://127.0.0.1');

      key = uri.pathname.replace(
        /^\//,
        '',
      ) as Manifest.DoctorManifestMappingKeys;
    }

    const data = await this.loadData(key);

    return data;
  }

  @Router.post(SDK.ServerAPI.API.SendAPIDataToClient)
  public async sendMessageToClient(): Promise<
    SDK.ServerAPI.InferResponseType<SDK.ServerAPI.API.SendAPIDataToClient>
  > {
    const { req, server } = this.ctx;
    const { api, data } =
      req.body as SDK.ServerAPI.InferRequestBodyType<SDK.ServerAPI.API.SendAPIDataToClient>;

    await server.sendAPIDataToClient(api, data);
  }
}
