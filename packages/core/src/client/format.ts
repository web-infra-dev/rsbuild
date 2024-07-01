import type { StatsCompilation, StatsError } from '@rspack/core';
import type { OverlayError } from '../types';
import { findSourceCode } from './findSourceMap';

function resolveFileName(stats: StatsError) {
  // Get the real source file path with stats.moduleIdentifier.
  // e.g. moduleIdentifier is "builtin:react-refresh-loader!/Users/x/src/App.jsx"
  if (stats.moduleIdentifier) {
    const regex = /(?:\!|^)([^!]+)$/;
    const matched = stats.moduleIdentifier.match(regex);
    if (matched) {
      const fileName = matched.pop();
      if (fileName) {
        // add default column add lines for linking
        return `File: ${fileName}:1:1\n`;
      }
    }
  }

  // fallback to moduleName if moduleIdentifier parse failed
  return stats.moduleName ? `File: ${stats.moduleName}\n` : '';
}

function hintUnknownFiles(message: string): string {
  const hint = 'You may need an appropriate loader to handle this file type.';

  if (message.indexOf(hint) === -1) {
    return message;
  }

  if (/File: .+\.s(c|a)ss/.test(message)) {
    return message.replace(
      hint,
      `To enable support for Sass, use "@rsbuild/plugin-sass".`,
    );
  }
  if (/File: .+\.less/.test(message)) {
    return message.replace(
      hint,
      `To enable support for Less, use "@rsbuild/plugin-less".`,
    );
  }
  if (/File: .+\.styl(us)?/.test(message)) {
    return message.replace(
      hint,
      `To enable support for Stylus, use "@rsbuild/plugin-stylus".`,
    );
  }

  return message;
}

// Cleans up Rspack error messages.
function formatMessage(stats: StatsError | string, verbose?: boolean) {
  let lines: string[] = [];
  let message: string;

  // Stats error object
  if (typeof stats === 'object') {
    const fileName = resolveFileName(stats);
    const mainMessage = stats.message;
    const details =
      verbose && stats.details ? `\nDetails: ${stats.details}\n` : '';
    const stack = verbose && stats.stack ? `\n${stats.stack}` : '';

    message = `${fileName}${mainMessage}${details}${stack}`;
  } else {
    message = stats;
  }

  message = hintUnknownFiles(message);

  lines = message.split('\n');

  // Remove duplicated newlines
  lines = lines.filter(
    (line, index, arr) =>
      index === 0 ||
      line.trim() !== '' ||
      line.trim() !== arr[index - 1].trim(),
  );

  // Reassemble the message
  message = lines.join('\n');

  const innerError = '-- inner error --';
  if (!verbose && message.includes(innerError)) {
    message = message.split(innerError)[0];
  }

  return message.trim();
}

export function formatStatsMessages(
  stats: Pick<StatsCompilation, 'errors' | 'warnings'>,
  verbose?: boolean,
): {
  errors: string[];
  warnings: string[];
} {
  const formattedErrors =
    stats.errors?.map((error) => formatMessage(error, verbose)) || [];
  const formattedWarnings =
    stats.warnings?.map((warning) => formatMessage(warning, verbose)) || [];

  return {
    errors: formattedErrors,
    warnings: formattedWarnings,
  };
}

function isRejectionEvent(
  isRejection: boolean,
  _event: any,
): _event is PromiseRejectionEvent {
  return !!isRejection;
}

export async function formatRuntimeErrors(
  event: PromiseRejectionEvent,
  isRejection: true,
): Promise<OverlayError>;
export async function formatRuntimeErrors(
  event: ErrorEvent,
  isRejection: false,
): Promise<OverlayError>;

export async function formatRuntimeErrors(
  event: PromiseRejectionEvent | ErrorEvent,
  isRejection: boolean,
): Promise<OverlayError | undefined> {
  const error = isRejectionEvent(isRejection, event)
    ? event.reason
    : event?.error;

  if (!error) return;
  const errorName = isRejection
    ? `Unhandled Rejection (${error.name})`
    : error.name;

  const stack = parseRuntimeStack(error.stack);
  const content = await createRuntimeContent(error.stack);
  return {
    title: `${errorName}: ${error.message}`,
    content: content?.sourceCode || error.stack,
    type: 'runtime',
    stack: stack,
    sourceFile: content?.sourceFile,
  };
}

export function formatBuildErrors(errors: StatsError[]): OverlayError {
  const content = formatMessage(errors[0]);

  return {
    title: 'Failed to compile',
    type: 'build',
    content: content,
  };
}

function parseRuntimeStack(stack: string) {
  let lines = stack.split('\n').slice(1);
  lines = lines.map((info) => info.trim()).filter((line) => line !== '');
  return lines;
}

/**
 * Get the source code according to the error stack
 * click on it and open the editor to jump to the corresponding source code location
 */
async function createRuntimeContent(stack: string) {
  const lines = stack.split('\n').slice(1);

  // Matches file paths in the error stack, generated via chatgpt.
  const regex = /(?:at|in)?(?<filename>http[^\s]+):(?<line>\d+):(?<column>\d+)/;
  let sourceInfo = {} as any;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(regex);
    if (match) {
      const { filename, line, column } = match.groups as any;
      sourceInfo = { filename, line, column };
      break;
    }
  }
  if (!sourceInfo.filename) return;

  try {
    const content = await findSourceCode(sourceInfo);
    return content;
  } catch (e) {}
}
