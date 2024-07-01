const fetchContent = (url: string) => fetch(url).then((r) => r.text());

const findSourceMap = async (fileSource: string, filename: string) => {
  try {
    // Prefer to get it via filename + '.map'.
    const mapUrl = `${filename}.map`;
    return await fetchContent(mapUrl);
  } catch (e) {
    const mapUrl = fileSource.match(/\/\/# sourceMappingURL=(.*)$/)?.[1];
    if (mapUrl) return await fetchContent(mapUrl);
  }
};

// Format line numbers to ensure alignment
const parseLineNumber = (start: number, end: number) => {
  const digit = Math.max(start.toString().length, end.toString().length);
  return (line: number) => line.toString().padStart(digit);
};

// Escapes html tags to prevent them from being parsed in pre tags
const escapeHTML = (str: string) =>
  str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

// Based on the sourceMap information, beautify the source code and mark the error lines
const formatSourceCode = (sourceCode: string, pos: any) => {
  // Note that the line starts at 1, not 0.
  const { line: crtLine, column, name } = pos;
  const lines = sourceCode.split('\n');

  // Display up to 6 lines of source code
  const lineCount = Math.min(lines.length, 6);
  const result = [];

  const startLine = Math.max(1, crtLine - 2);
  const endLine = Math.min(startLine + lineCount - 1, lines.length);

  const parse = parseLineNumber(startLine, endLine);

  for (let line = startLine; line <= endLine; line++) {
    const prefix = `${line === crtLine ? '->' : '  '} ${parse(line)} | `;
    const lineCode = escapeHTML(lines[line - 1] ?? '');
    result.push(prefix + lineCode);

    // When the sourcemap information includes specific column details, add an error hint below the error line.
    if (line === crtLine && column > 0) {
      const errorLine = `${' '.repeat(prefix.length + column)}<span style="color: #fc5e5e;">${'^'.repeat(name?.length || 1)}</span>`;
      result.push(errorLine);
    }
  }

  return result.filter(Boolean).join('\n');
};

// Try to find the source based on the sourceMap information.
export const findSourceCode = async (sourceInfo: any) => {
  const { filename, line, column } = sourceInfo;
  const fileSource = await fetch(filename).then((r) => r.text());

  const smContent = await findSourceMap(fileSource, filename);

  if (!smContent) return;
  const rawSourceMap = JSON.parse(smContent);

  const { SourceMapConsumer } = await import('source-map-js');

  const consumer = await new SourceMapConsumer(rawSourceMap);

  // Use sourcemap to find the source code location
  const pos = consumer.originalPositionFor({
    line: Number.parseInt(line, 10),
    column: Number.parseInt(column, 10),
  });

  const url = `${pos.source}:${pos.line}:${pos.column}`;
  const sourceCode = consumer.sourceContentFor(pos.source);
  return {
    sourceCode: formatSourceCode(sourceCode, pos),
    // Please use an absolute path in order to open it in vscode.
    // Take webpack as an example. Please configure it correctly for [output.devtoolModuleFilenameTemplate](https://www.webpackjs.com/configuration/output/#outputdevtoolmodulefilenametemplate)
    sourceFile: url,
  };
};
