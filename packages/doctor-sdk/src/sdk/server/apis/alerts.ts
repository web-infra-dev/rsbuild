import { SDK } from '@rsbuild/doctor-types';
import { BaseAPI } from './base';
import { Router } from '../router';

export class AlertsAPI extends BaseAPI {
  @Router.post(SDK.ServerAPI.API.GetPackageRelationAlertDetails)
  public async getPackageRelationAlertDetails(): Promise<
    SDK.ServerAPI.InferResponseType<SDK.ServerAPI.API.GetPackageRelationAlertDetails>
  > {
    const { req } = this.ctx;

    const { id, target } =
      req.body as SDK.ServerAPI.InferRequestBodyType<SDK.ServerAPI.API.GetPackageRelationAlertDetails>;

    return this.dataLoader.loadAPI(
      SDK.ServerAPI.API.GetPackageRelationAlertDetails,
      { id, target },
    );
  }
}
