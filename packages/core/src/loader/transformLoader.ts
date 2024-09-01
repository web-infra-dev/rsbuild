import type { LoaderContext } from '@rspack/core';
import type { EnvironmentContext, Rspack, TransformContext } from '../types';

export type TransformLoaderOptions = {
  id: string;
  getEnvironment: () => EnvironmentContext;
};

export default async function transform(
  this: LoaderContext<TransformLoaderOptions>,
  source: string,
  map?: string | Rspack.sources.RawSourceMap,
): Promise<void> {
  const callback = this.async();
  const bypass = () => callback(null, source, map);

  const { id: transformId, getEnvironment } = this.getOptions();
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
    environment: getEnvironment(),
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
