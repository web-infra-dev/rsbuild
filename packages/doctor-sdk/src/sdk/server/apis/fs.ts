import { SDK } from '@rsbuild/doctor-types';

import { BaseAPI } from './base';
import { Router } from '../router';

export class FileSystemAPI extends BaseAPI {
  @Router.post(SDK.ServerAPI.API.ApplyErrorFix)
  public async applyErrorFix(): Promise<
    SDK.ServerAPI.InferResponseType<SDK.ServerAPI.API.ApplyErrorFix>
  > {
    const { body } = this.ctx.req;
    const data = body as { id: number };

    await this.ctx.sdk.applyErrorFix(data.id);

    return 'success';
  }
}
