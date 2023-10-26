import { SDK } from '@rsbuild/doctor-types';

export function getEntryPoints(
  entrypoints: SDK.EntryPointData[],
): SDK.ServerAPI.InferResponseType<SDK.ServerAPI.API.GetEntryPoints> {
  return entrypoints;
}
