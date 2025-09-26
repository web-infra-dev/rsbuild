import path from 'node:path';
import { promisify } from 'node:util';
import { parse as parseStack } from 'stacktrace-parser';
import { JS_REGEX } from '../constants';
import { color } from '../helpers';
import { logger } from '../logger';
import type { EnvironmentContext, InternalContext, Rspack } from '../types';
import { getFileFromUrl } from './assets-middleware/getFileFromUrl';
import type { OutputFileSystem } from './assets-middleware/index';
import type { ClientMessageRuntimeError } from './socketServer';

/**
 * Maps a position in compiled code to its original source position using
 * source maps.
 */
async function mapSourceMapPosition(
  rawSourceMap: string,
  line: number,
  column: number,
) {
  const { SourceMapConsumer } = await import(
    '../../compiled/source-map/index.js'
  );
  const consumer = await new SourceMapConsumer(rawSourceMap);
  const originalPosition = consumer.originalPositionFor({ line, column });
  consumer.destroy();
  return originalPosition;
}

/**
 * Resolve source filename and original position from runtime stack trace
 */
const resolveSourceLocation = async (
  stack: string,
  fs: Rspack.OutputFileSystem,
  environments: Record<string, EnvironmentContext>,
) => {
  const parsed = parseStack(stack);
  if (!parsed.length) {
    return;
  }

  // only parse JS files
  const { file, column, lineNumber } = parsed[0];
  if (
    file === null ||
    column === null ||
    lineNumber === null ||
    !JS_REGEX.test(file)
  ) {
    return;
  }

  const sourceMapInfo = getFileFromUrl(
    `${file}.map`,
    fs as OutputFileSystem,
    environments,
  );

  if (!sourceMapInfo || 'errorCode' in sourceMapInfo) {
    return;
  }

  const readFile = promisify(fs.readFile);
  try {
    const sourceMap = await readFile(sourceMapInfo.filename);
    if (sourceMap) {
      return await mapSourceMapPosition(
        sourceMap.toString(),
        lineNumber,
        column,
      );
    }
  } catch {}
};

/**
 * Formats error location information into a readable relative path string.
 */
const formatErrorLocation = async (
  stack: string,
  context: InternalContext,
  fs: Rspack.OutputFileSystem,
) => {
  const parsed = await resolveSourceLocation(stack, fs, context.environments);

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

/**
 * Processes runtime errors received from the browser and logs them with
 * source location information.
 */
export const reportRuntimeError = async (
  message: ClientMessageRuntimeError,
  context: InternalContext,
  fs: Rspack.OutputFileSystem,
): Promise<void> => {
  let log = `${color.cyan('[browser]')} ${color.red(message.message)}`;

  if (message.stack) {
    const rawLocation = await formatErrorLocation(message.stack, context, fs);
    log += color.dim(` (${rawLocation})`);
  }

  logger.error(log);
};
