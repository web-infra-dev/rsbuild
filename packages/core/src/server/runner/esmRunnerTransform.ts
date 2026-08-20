import path from 'node:path';
import { STATIC_PATH } from '../../constants';
import { color } from '../../helpers';

export type TransformSourceFile = Readonly<{
  path: string;
  source: string;
  sourceMap?: string;
}>;

export type SwcTransformOutput = {
  code: string;
  map?: string;
};

export type SwcTransform = (
  source: string,
  options: Record<string, unknown>,
) => Promise<SwcTransformOutput> | SwcTransformOutput;

export const ESM_RUNNER_TRANSFORM_PLUGIN_PATH: string = path.join(
  STATIC_PATH,
  'swc-esm-runner-transform.wasm',
);

const TRANSFORMED_ESM_PARAMETERS = [
  '__rsbuild_import__',
  '__rsbuild_dynamic_import__',
  '__rsbuild_exports__',
  '__rsbuild_export_all__',
  '__rsbuild_export_name__',
  '__rsbuild_import_meta__',
];

const STRICT_MODE_PREFIX = '"use strict";\n';

const ASYNC_FUNCTION_BODY_LINE_OFFSET = (() => {
  const marker = '/* module-runner-body */';
  const AsyncFunction = async function () {}.constructor as new (
    ...parameters: string[]
  ) => (...args: unknown[]) => Promise<unknown>;
  // rslint-disable-next-line @typescript-eslint/no-implied-eval
  const source = new AsyncFunction(
    ...TRANSFORMED_ESM_PARAMETERS,
    marker,
  ).toString();
  return source.slice(0, source.indexOf(marker)).split('\n').length - 1;
})();

const offsetSourceMap = (sourceMap: string): string => {
  const payload = JSON.parse(sourceMap) as { mappings?: unknown };
  if (typeof payload.mappings !== 'string') {
    return sourceMap;
  }
  payload.mappings = `${';'.repeat(ASYNC_FUNCTION_BODY_LINE_OFFSET + 1)}${payload.mappings}`;
  return JSON.stringify(payload);
};

const appendSourceMetadata = (
  code: string,
  sourceMap: string | undefined,
  moduleId: string,
): string => {
  const executable = `${STRICT_MODE_PREFIX}${code.trimEnd()}`;
  const sourceUrl = `//# sourceURL=${moduleId}`;
  if (!sourceMap) {
    return `${executable}\n${sourceUrl}`;
  }
  const encoded = Buffer.from(offsetSourceMap(sourceMap)).toString('base64');
  // Keep the complete directive out of Rsbuild's own bundled source so source
  // map scanners do not mistake this template for the bundle's map.
  const sourceMappingUrl = `sourceMapping${String.fromCharCode(85, 82, 76)}`;
  return `${executable}\n${sourceUrl}\n//# ${sourceMappingUrl}=data:application/json;base64,${encoded}`;
};

export const transformForTransformedEsm = async (
  file: TransformSourceFile,
  transform: SwcTransform,
): Promise<string> => {
  let result: SwcTransformOutput;
  try {
    result = await transform(file.source, {
      configFile: false,
      filename: file.path,
      inlineSourcesContent: true,
      inputSourceMap: file.sourceMap ?? false,
      isModule: true,
      jsc: {
        parser: { dynamicImport: true, syntax: 'ecmascript' },
        target: 'es2022',
        experimental: {
          // swc_plugin_runner falls back to its process-memory cache when this
          // existing file cannot be created as a cache directory.
          cacheRoot: ESM_RUNNER_TRANSFORM_PLUGIN_PATH,
          plugins: [[ESM_RUNNER_TRANSFORM_PLUGIN_PATH, {}]],
        },
      },
      module: { type: 'es6' },
      sourceMaps: true,
      swcrc: false,
    });
  } catch (error) {
    const reason = error instanceof Error ? `: ${error.message}` : '';
    throw new Error(
      `${color.dim('[rsbuild:runner]')} Failed to transform ${file.path} for the module runner with ${ESM_RUNNER_TRANSFORM_PLUGIN_PATH}${reason}`,
      { cause: error },
    );
  }

  if (!result || typeof result.code !== 'string') {
    throw new Error(
      `${color.dim('[rsbuild:runner]')} SWC returned no module-runner code for ${file.path}`,
    );
  }

  return appendSourceMetadata(result.code, result.map, file.path);
};
