import type { LoaderContext } from '@rspack/core';
import type { EnvironmentContext, Rspack } from '../types';

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
  const bypass = () => {
    callback(null, source, map);
  };

  const { id: transformId, getEnvironment } = this.getOptions();
  if (!transformId) {
    bypass();
    return;
  }

  const transform = this._compiler?.__rsbuildTransformer?.[transformId];
  if (!transform) {
    bypass();
    return;
  }

  try {
    const result = await transform({
      code: source,
      context: this.context,
      resource: this.resource,
      resourcePath: this.resourcePath,
      resourceQuery: this.resourceQuery,
      environment: getEnvironment(),
      addDependency: this.addDependency.bind(this),
      addMissingDependency: this.addMissingDependency.bind(this),
      addContextDependency: this.addContextDependency.bind(this),
      emitFile: this.emitFile.bind(this),
      importModule: this.importModule.bind(this),
      resolve: this.resolve.bind(this),
    });

    if (result === null || result === undefined) {
      bypass();
      return;
    }

    if (typeof result === 'string') {
      callback(null, result, map);
      return;
    }

    const useMap = map !== undefined && map !== null;
    const finalMap = result.map ?? map;
    callback(null, result.code, useMap ? finalMap : undefined);
  } catch (error) {
    if (error instanceof Error) {
      callback(error);
    } else {
      callback(new Error(String(error)));
    }
  }
}
