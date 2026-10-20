import { parseSync } from '@swc-next/core';
import { esmRunnerPlugin, type EsmRunnerPluginResult } from './esmRunnerPlugin';
import { color } from '../../helpers';

export type TransformSourceFile = Readonly<{
  path: string;
  source: string;
  sourceMap?: string;
}>;

const STRICT_MODE_PREFIX = '"use strict";\n';

const ASYNC_FUNCTION_BODY_LINE_OFFSET = (() => {
  const marker = '/* module-runner-body */';
  const AsyncFunction = async function () {}.constructor as new (
    ...parameters: string[]
  ) => (...args: unknown[]) => Promise<unknown>;
  // rslint-disable-next-line @typescript-eslint/no-implied-eval
  const source = new AsyncFunction(marker).toString();
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
): Promise<Pick<EsmRunnerPluginResult, 'code' | 'parameters'>> => {
  try {
    const { program, diagnostics } = parseSync(file.source, {
      sourceType: 'module',
      lang: 'js',
      preserveParens: false,
      semanticErrors: true,
    });
    const errors = diagnostics.filter(
      (diagnostic) => diagnostic.severity === 'error',
    );
    if (errors.length) {
      throw new SyntaxError(errors.map((error) => error.message).join('\n'));
    }
    const result = esmRunnerPlugin(program, file.source, file.path);
    let sourceMap = result.map;
    if (file.sourceMap) {
      const { default: remapping } = await import(
        /* rspackChunkName: "remapping" */ '@jridgewell/remapping'
      );
      sourceMap = remapping(
        [result.map, file.sourceMap],
        () => null,
      ).toString();
    }
    return {
      code: appendSourceMetadata(result.code, sourceMap, file.path),
      parameters: result.parameters,
    };
  } catch (error) {
    const reason = error instanceof Error ? `: ${error.message}` : '';
    throw new Error(
      `${color.dim('[rsbuild:runner]')} Failed to transform ${file.path} for the module runner with SWC Next${reason}`,
      { cause: error },
    );
  }
};
