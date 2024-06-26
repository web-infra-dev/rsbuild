import type { RspackSourceMap, TransformContext } from '@rsbuild/shared';
import type { LoaderContext } from '@rspack/core';

export default async function transform(
  this: LoaderContext<{ id: string }>,
  source: string,
  map?: string | RspackSourceMap,
): Promise<void> {
  const callback = this.async();
  const bypass = () => callback(null, source, map);

  const transformId = this.getOptions().id;
  if (!transformId) {
    return bypass();
  }

  const transform = this._compiler?.__rsbuildTransformer?.[transformId];
  if (!transform) {
    return bypass();
  }

  const result = await transform({
    code: source,
    resource: this.resource,
    resourcePath: this.resourcePath,
    resourceQuery: this.resourceQuery,
    addDependency: this.addDependency,
    emitFile: this.emitFile as TransformContext['emitFile'],
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
