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

const appendInlineSourceMap = (code: string, sourceMap: string | undefined) => {
  const executable = code.replace(SOURCE_MAP_COMMENT, '').trimEnd();
  if (!sourceMap) {
    return executable;
  }
  const encoded = Buffer.from(sourceMap).toString('base64');
  return `${executable}\n//# sourceMappingURL=data:application/json;base64,${encoded}`;
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
        // Target ES5 so SWC lowers destructuring assignments before its SystemJS
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
    throw new Error(`Failed to transform ${file.path} to System.register${reason}`, {
      cause: error,
    });
  }

  if (!result || typeof result.code !== 'string') {
    throw new Error(`SWC returned no code for ${file.path}`);
  }
  return appendInlineSourceMap(result.code, result.map);
};
