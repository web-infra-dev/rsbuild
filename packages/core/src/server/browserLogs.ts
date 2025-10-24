import path from 'node:path';
import { promisify } from 'node:util';
import { parse as parseStack, type StackFrame } from 'stacktrace-parser';
import { SCRIPT_REGEX } from '../constants';
import { color, isObject } from '../helpers';
import { requireCompiledPackage } from '../helpers/vendors';
import { logger } from '../logger';
import type { InternalContext, Rspack } from '../types';
import { getFileFromUrl } from './assets-middleware/getFileFromUrl';
import type { OutputFileSystem } from './assets-middleware/index';
import type { ClientMessageError } from './socketServer';

/**
 * Maps a position in compiled code to its original source position using
 * source maps.
 */
function mapSourceMapPosition(
  rawSourceMap: string,
  line: number,
  column: number,
) {
  const { TraceMap, originalPositionFor } = requireCompiledPackage(
    '@jridgewell/trace-mapping',
  );
  const tracer = new TraceMap(rawSourceMap);
  const originalPosition = originalPositionFor(tracer, { line, column });
  return originalPosition;
}

/**
 * Returns the first stack frame that looks like user code
 */
const findSourceFrame = (parsed: StackFrame[]) => {
  return parsed.find(
    (frame) =>
      frame.file !== null &&
      frame.column !== null &&
      frame.lineNumber !== null &&
      SCRIPT_REGEX.test(frame.file),
  ) as { file: string; column: number; lineNumber: number } | undefined;
};

/**
 * Resolve source filename and original position from runtime stack trace
 */
const resolveSourceLocation = async (
  stack: string,
  fs: Rspack.OutputFileSystem,
  context: InternalContext,
) => {
  const { browserLogs } = context.normalizedConfig?.dev || {};
  const stackTrace =
    (isObject(browserLogs) && browserLogs?.stackTrace) || 'summary';

  if (stackTrace === 'none') {
    return;
  }

  const parsed = parseStack(stack);
  if (!parsed.length) {
    return;
  }

  // only parse JS files
  const frame = findSourceFrame(parsed);
  if (!frame) {
    return;
  }

  const { file, column, lineNumber } = frame;
  const sourceMapInfo = await getFileFromUrl(
    `${file}.map`,
    fs as OutputFileSystem,
    context,
  );

  if (!sourceMapInfo || 'errorCode' in sourceMapInfo) {
    return;
  }

  const readFile = promisify(fs.readFile);
  try {
    const sourceMap = await readFile(sourceMapInfo.filename);
    if (sourceMap) {
      return mapSourceMapPosition(sourceMap.toString(), lineNumber, column);
    }
  } catch (error) {
    if (error instanceof Error) {
      logger.debug(`failed to map source map position: ${error.message}`);
    }
  }
};

/**
 * Formats error location information into a readable relative path string.
 */
const formatErrorLocation = async (
  stack: string,
  context: InternalContext,
  fs: Rspack.OutputFileSystem,
) => {
  const parsed = await resolveSourceLocation(stack, fs, context);

  if (!parsed) {
    return;
  }

  const { source, line, column } = parsed;
  if (!source) {
    return;
  }

  let rawLocation = path.relative(context.rootPath, source);
  if (line !== null) {
    rawLocation += column === null ? `:${line}` : `:${line}:${column}`;
  }
  return rawLocation;
};

const enhanceBrowserErrorLog = (log: string) => {
  const isProcessUndefined = log.includes(
    'ReferenceError: process is not defined',
  );
  if (isProcessUndefined) {
    return `${log}\n${color.yellow(`        - \`process\` is a Node.js global and not available in browsers.
        - To access \`process.env.*\`, define them in a \`.env\` file with the \`PUBLIC_\` prefix.
        - Or configure them via \`source.define\`.
        - Alternatively, install \`@rsbuild/plugin-node-polyfill\` to polyfill Node.js globals.`)}`;
  }

  return log;
};

/**
 * Formats error messages received from the browser into a log string with
 * source location information.
 */
export const formatBrowserErrorLog = async (
  message: ClientMessageError,
  context: InternalContext,
  fs: Rspack.OutputFileSystem,
): Promise<string> => {
  let log = `${color.cyan('[browser]')} ${color.red(message.message)}`;

  if (message.stack) {
    const rawLocation = await formatErrorLocation(message.stack, context, fs);
    if (rawLocation) {
      log += color.dim(` (${rawLocation})`);
    }
  }

  return enhanceBrowserErrorLog(log);
};
