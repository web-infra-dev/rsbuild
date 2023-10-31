import { SDK } from '@rsbuild/doctor-types';
import { BaseAPI } from './base';
import { Router } from '../router';

export class BundleDiffAPI extends BaseAPI {
  @Router.get(SDK.ServerAPI.API.GetBundleDiffSummary)
  public async getBundleDiffSummary(): Promise<
    SDK.ServerAPI.InferResponseType<SDK.ServerAPI.API.GetBundleDiffSummary>
  > {
    const { sdk } = this.ctx;
    const {
      root,
      hash,
      errors,
      chunkGraph,
      moduleGraph,
      packageGraph,
      configs,
      moduleCodeMap,
    } = sdk.getStoreData();

    let outputFilename = '';

    if (typeof configs?.[0]?.config?.output?.filename === 'string') {
      outputFilename = configs?.[0]?.config?.output?.filename;
    }

    return {
      root,
      hash,
      errors,
      chunkGraph,
      moduleGraph,
      packageGraph,
      outputFilename,
      moduleCodeMap,
      cloudManifestUrl: sdk.cloudManifestUrl,
    };
  }

  @Router.get(SDK.ServerAPI.API.BundleDiffManifest)
  public async bundleDiffManifest(): Promise<
    SDK.ServerAPI.InferResponseType<SDK.ServerAPI.API.BundleDiffManifest>
  > {
    const { sdk } = this.ctx;
    const data = sdk.getStoreData();
    return data;
  }
}
