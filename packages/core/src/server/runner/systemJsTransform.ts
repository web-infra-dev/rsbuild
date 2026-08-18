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

const SOURCE_MAP_COMMENT =
  /(?:\/\/[#@]\s*sourceMappingURL=[^\s]+|\/\*[#@]\s*sourceMappingURL=[^*]+?\s*\*\/)/gm;

const SOURCE_URL_COMMENT =
  /(?:\/\/[#@]\s*sourceURL=[^\r\n]*|\/\*[#@]\s*sourceURL=[^*]+?\s*\*\/)/gm;

const FUNCTION_BODY_LINE_OFFSET = (() => {
  const marker = '/* systemjs-body */';
  // rslint-disable-next-line @typescript-eslint/no-implied-eval
  const source = new Function('System', marker).toString();
  return source.slice(0, source.indexOf(marker)).split('\n').length - 1;
})();

const offsetSourceMap = (sourceMap: string): string => {
  const payload = JSON.parse(sourceMap) as { mappings?: unknown };
  if (typeof payload.mappings !== 'string') {
    return sourceMap;
  }
  payload.mappings = `${';'.repeat(FUNCTION_BODY_LINE_OFFSET)}${payload.mappings}`;
  return JSON.stringify(payload);
};

const appendInlineSourceMap = (
  code: string,
  sourceMap: string | undefined,
  moduleId: string,
) => {
  const executable = code
    .replace(SOURCE_MAP_COMMENT, '')
    .replace(SOURCE_URL_COMMENT, '')
    .trimEnd();
  const sourceUrl = `//# sourceURL=${moduleId}`;
  if (!sourceMap) {
    return `${executable}\n${sourceUrl}`;
  }
  const encoded = Buffer.from(offsetSourceMap(sourceMap)).toString('base64');
  // Construct "URL" at runtime to keep the complete source map directive out
  // of Rsbuild's bundled source. Regex-based source map scanners may otherwise
  // mistake this template literal for the source map of the bundle itself.
  const sourceMappingUrl = `sourceMapping${String.fromCharCode(85, 82, 76)}`;
  return `${executable}\n${sourceUrl}\n//# ${sourceMappingUrl}=data:application/json;base64,${encoded}`;
};

export const transformToSystemJs = async (
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
        // TODO: Target ES5 so SWC lowers destructuring assignments before its SystemJS
        // transform, which can otherwise emit invalid `<invalid> = ...` targets.
        // Remove this workaround once https://github.com/swc-project/swc/pull/12122 lands.
        target: 'es5',
      },
      module: { type: 'systemjs' },
      sourceMaps: true,
      swcrc: false,
    });
  } catch (error) {
    const reason = error instanceof Error ? `: ${error.message}` : '';
    throw new Error(
      `Failed to transform ${file.path} to System.register${reason}`,
      {
        cause: error,
      },
    );
  }

  if (!result || typeof result.code !== 'string') {
    throw new Error(`SWC returned no code for ${file.path}`);
  }
  return appendInlineSourceMap(result.code, result.map, file.path);
};
