import { Manifest } from '@rsbuild/doctor-types';
import { decompressText } from './algorithm';
import { isRemoteUrl } from './url';

export function isShardingData(data: unknown): data is string[] {
  if (Array.isArray(data) && data.length > 0) {
    if (data.every((e) => isRemoteUrl(e))) {
      return true;
    }
  }

  return false;
}

export async function fetchShardingData(
  shardingFiles: string[],
  fetchImplement: (url: string) => Promise<string>,
) {
  const res = await Promise.all(
    shardingFiles.map((url: string) => fetchImplement(url)),
  );

  const strings = res.length === 0 ? [] : res.reduce((t, e) => t + e);

  return typeof strings === 'object'
    ? strings
    : JSON.parse(decompressText(strings));
}

export async function fetchShardingFiles(
  data: Manifest.DoctorManifestWithShardingFiles['data'],
  fetchImplement: (url: string) => Promise<string>,
  filterKeys?: Array<keyof Manifest.DoctorManifestData>,
) {
  const datas = await Promise.all(
    Object.keys(data).map(async (_key) => {
      const key = _key as keyof Manifest.DoctorManifestData;
      const val = data[key];
      if (filterKeys?.length && filterKeys.indexOf(key) < 0) {
        return {
          [key]: [],
        };
      }
      if (isShardingData(val)) {
        return {
          [key]: await fetchShardingData(val, fetchImplement),
        };
      }

      return {
        [key]: val,
      };
    }),
  );

  return datas.reduce((t, c) =>
    Object.assign(t, c),
  ) as Manifest.DoctorManifestData;
}
