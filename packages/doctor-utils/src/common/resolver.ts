import { SDK } from '@rsbuild/doctor-types';
import { mergeIntervals } from './algorithm';

export function isResolveSuccessData(
  data: SDK.PathResolverData,
): data is SDK.PathResolverSuccessData {
  return Boolean((data as SDK.PathResolverSuccessData).result);
}

export function isResolveFailData(
  data: SDK.PathResolverData,
): data is SDK.PathResolverSuccessData {
  return Boolean((data as SDK.PathResolverFailData).error);
}

export function getResolverCosts(
  resolver: SDK.PathResolverData,
  resolvers: SDK.ResolverData,
) {
  const blocked = resolvers.filter(
    (e) =>
      e !== resolver &&
      e.pid === resolver.pid &&
      e.startAt >= resolver.startAt &&
      e.endAt <= resolver.endAt,
  );

  let costs = resolver.endAt - resolver.startAt;

  if (blocked.length) {
    const intervals: [number, number][] = blocked.map((e) => [
      Math.max(e.startAt, resolver.startAt),
      Math.min(e.endAt, resolver.endAt),
    ]);

    mergeIntervals(intervals).forEach((e) => {
      const sub = e[1] - e[0];
      costs -= sub;
    });
  }

  return costs;
}

export function getResolverFileTree(
  resolver: SDK.ResolverData,
): SDK.ServerAPI.InferResponseType<SDK.ServerAPI.API.GetResolverFileTree> {
  return resolver.map((e) => ({ issuerPath: e.issuerPath }));
}

export function getResolverFileDetails(
  filepath: string,
  resolvers: SDK.ResolverData,
  modules: SDK.ModuleData[],
  moduleCodeMap: SDK.ModuleCodeData,
): SDK.ServerAPI.InferResponseType<SDK.ServerAPI.API.GetResolverFileDetails> {
  const module = modules.find((item) => item.path === filepath);
  const matchResolvers = resolvers.filter((e) => e.issuerPath === filepath);

  const before =
    module && moduleCodeMap && moduleCodeMap[module.id]
      ? moduleCodeMap[module.id].source
      : '';

  const after = matchResolvers.reduce((t, c) => {
    if (c.request && isResolveSuccessData(c)) {
      return t.replace(new RegExp(`["']${c.request}["']`), `"${c.result}"`);
    }
    return t;
  }, before);

  return {
    filepath,
    before,
    after,
    resolvers: matchResolvers.map((e) => ({
      ...e,
      costs: getResolverCosts(e, resolvers),
    })),
  };
}
