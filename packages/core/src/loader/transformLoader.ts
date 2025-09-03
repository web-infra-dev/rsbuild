import type { LoaderDefinition, sources } from '@rspack/core';
import type { EnvironmentContext } from '../types';

export type TransformLoaderOptions = {
  id: string;
  getEnvironment: () => EnvironmentContext;
};

const mergeSourceMap = async (
  originalSourceMap?: sources.RawSourceMap | string,
  generatedSourceMap?: sources.RawSourceMap | string | null,
): Promise<sources.RawSourceMap | string | undefined> => {
  if (!originalSourceMap || !generatedSourceMap) {
    return generatedSourceMap ?? originalSourceMap;
  }

  const { default: remapping } = await import(
    '../../compiled/@jridgewell/remapping/index.js'
  );
  return remapping([generatedSourceMap, originalSourceMap], () => null);
};

const transformLoader: LoaderDefinition<TransformLoaderOptions> =
  async function transform(source, map): Promise<void> {
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

      const mergedMap = await mergeSourceMap(
        map as sources.RawSourceMap,
        result.map,
      );
      callback(null, result.code, mergedMap);
    } catch (error) {
      if (error instanceof Error) {
        callback(error);
      } else {
        callback(new Error(String(error)));
      }
    }
  };

export default transformLoader;
