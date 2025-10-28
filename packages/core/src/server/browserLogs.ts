import path from 'node:path';
import { promisify } from 'node:util';
import { parse as parseStack, type StackFrame } from 'stacktrace-parser';
import type {
  InvalidOriginalMapping,
  OriginalMapping,
} from '../../compiled/@jridgewell/trace-mapping';
import { SCRIPT_REGEX } from '../constants';
import { color } from '../helpers';
import { requireCompiledPackage } from '../helpers/vendors';
import { logger } from '../logger';
import type { BrowserLogsStackTrace, InternalContext, Rspack } from '../types';
import { getFileFromUrl } from './assets-middleware/getFileFromUrl';
import type { OutputFileSystem } from './assets-middleware/index';
import type { ClientMessageError } from './socketServer';

/**
 * Determines whether a given string is a valid method name
 * extracted from a browser error stack trace.
 * Excludes file paths such as "./src/App.tsx"
 */
const isValidMethodName = (methodName: string) => {
  return methodName !== '<unknown>' && !/[\\/]/.test(methodName);
};

/**
 * Maps a position in compiled code to its original source position using
 * source maps.
 */
function getOriginalPosition(
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
const findFirstUserFrame = (parsed: StackFrame[]) => {
  return parsed.find(
    (frame) =>
      frame.file !== null &&
      frame.column !== null &&
      frame.lineNumber !== null &&
      SCRIPT_REGEX.test(frame.file),
  ) as
    | (StackFrame &
        Pick<Required<StackFrame>, 'file' | 'column' | 'lineNumber'>)
    | undefined;
};

const parseFrame = async (
  frame: Pick<StackFrame, 'file' | 'column' | 'lineNumber'>,
  fs: Rspack.OutputFileSystem,
  context: InternalContext,
) => {
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
      return {
        sourceMapPath: sourceMapInfo.filename,
        originalPosition: getOriginalPosition(
          sourceMap.toString(),
          lineNumber ?? 0,
          column ?? 0,
        ),
      };
    }
  } catch (error) {
    if (error instanceof Error) {
      logger.debug(`failed to map source map position: ${error.message}`);
    }
  }
};

/**
 * Resolve source filename and original position from runtime stack trace,
 * return formatted string like `src/App.tsx:10:20`
 */
const resolveOriginalLocation = async (
  stack: string,
  fs: Rspack.OutputFileSystem,
  context: InternalContext,
) => {
  const parsed = parseStack(stack);
  if (!parsed.length) {
    return;
  }

  // only parse JS files
  const frame = findFirstUserFrame(parsed);
  if (!frame) {
    return;
  }

  const parsedFrame = await parseFrame(frame, fs, context);
  if (!parsedFrame) {
    return;
  }

  const { sourceMapPath, originalPosition } = parsedFrame;
  return {
    frame,
    location: formatOriginalLocation(sourceMapPath, originalPosition, context),
  };
};

/**
 * Get relative source path that is relative to the project root.
 * By default, the source path is relative to the source map path or is absolute.
 */
const getRelativeSourcePath = (
  source: string,
  sourceMapPath: string,
  context: InternalContext,
) => {
  const absoluteSourcePath = path.isAbsolute(source)
    ? source
    : path.join(path.dirname(sourceMapPath), source);
  return path.relative(context.rootPath, absoluteSourcePath);
};

const formatOriginalLocation = (
  sourceMapPath: string,
  originalMapping: OriginalMapping | InvalidOriginalMapping,
  context: InternalContext,
) => {
  const { source, line, column } = originalMapping;
  if (!source) {
    return;
  }

  let result = getRelativeSourcePath(source, sourceMapPath, context);
  if (line !== null) {
    result += column === null ? `:${line}` : `:${line}:${column}`;
  }
  return result;
};

const formatFrameLocation = (frame: StackFrame) => {
  const { file, lineNumber, column } = frame;
  if (!file) {
    return;
  }
  if (lineNumber !== null) {
    return column !== null
      ? `${file}:${lineNumber}:${column}`
      : `${file}:${lineNumber}`;
  }
  return file;
};

const enhanceErrorLogWithHints = (log: string) => {
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

const formatFullStack = async (
  stack: string,
  context: InternalContext,
  fs: Rspack.OutputFileSystem,
) => {
  const parsed = parseStack(stack);

  if (!parsed.length) {
    return;
  }

  let result = '';

  for (const frame of parsed) {
    const parsedFrame = await parseFrame(frame, fs, context);
    const { methodName } = frame;
    const parts: (string | undefined)[] = [];

    if (isValidMethodName(methodName)) {
      parts.push(methodName);
    }

    if (parsedFrame) {
      const { sourceMapPath, originalPosition } = parsedFrame;
      const originalLocation = formatOriginalLocation(
        sourceMapPath,
        originalPosition,
        context,
      );
      if (originalLocation) {
        parts.push(originalLocation);
      } else {
        const frameString = formatFrameLocation(frame);
        if (frameString) {
          parts.push(frameString);
        }
      }
    } else {
      const frameString = formatFrameLocation(frame);
      if (frameString) {
        parts.push(frameString);
      }
    }

    if (parts[0]) {
      result += `\n    at ${parts[0]}`;
    }
    if (parts[1]) {
      result += ` (${parts[1]})`;
    }
  }

  return result;
};

/**
 * Formats error messages received from the browser into a log string with
 * source location information.
 */
export const formatBrowserErrorLog = async (
  message: ClientMessageError,
  context: InternalContext,
  fs: Rspack.OutputFileSystem,
  stackTrace: BrowserLogsStackTrace,
): Promise<string> => {
  let log = `${color.cyan('[browser]')} ${color.red(message.message)}`;

  if (message.stack) {
    switch (stackTrace) {
      case 'summary': {
        const resolved = await resolveOriginalLocation(
          message.stack,
          fs,
          context,
        );

        if (!resolved) {
          break;
        }

        const { frame, location } = resolved;
        const { methodName } = frame;

        let suffix = '';

        if (isValidMethodName(methodName)) {
          suffix += ` at ${methodName}`;
        }
        if (location) {
          suffix += ` (${location})`;
        }
        log += suffix ? color.dim(suffix) : '';
        break;
      }
      case 'full': {
        const fullStack = await formatFullStack(message.stack, context, fs);
        if (fullStack) {
          log += fullStack;
        }
        break;
      }
      case 'none':
        break;
    }
  }

  return enhanceErrorLogWithHints(log);
};
