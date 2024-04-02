import type { LoaderContext } from '@rspack/core';
import type { RspackSourceMap, TransformHandler } from '@rsbuild/shared';

const getTransformId = (query: string | { transformId: string }) => {
  if (typeof query === 'string') {
    const searchParams = new URLSearchParams(query);
    return searchParams.get('transformId');
  }
  return query.transformId;
};

declare module '@rspack/core' {
  interface Compiler {
    __rsbuildTransformer: Record<string, TransformHandler>;
  }
}

export default async function transform(
  this: LoaderContext<{ transformId: string }>,
  source: string,
  map?: string | RspackSourceMap,
) {
  const callback = this.async();
  const bypass = () => callback(null, source, map);

  const transformId = getTransformId(this.query);
  if (!transformId) {
    return bypass();
  }

  const transform = this._compiler?.__rsbuildTransformer[transformId];
  if (!transform) {
    return bypass();
  }

  const result = await transform({
    code: source,
    resource: this.resource,
  });

  if (result === null || result === undefined) {
    return bypass();
  }

  if (typeof result === 'string') {
    return callback(null, result, map);
  }

  const useMap = map !== undefined && map !== null;
  const finalMap = result.map ?? map;
  callback(null, result.code, useMap ? finalMap : undefined);
}
