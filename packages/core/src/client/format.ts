import type { StatsCompilation, StatsError } from '@rspack/core';
import type { OverlayError } from '../types';
import { findSourceCode } from './findSourceMap';

function resolveFileName(stats: StatsError) {
  // Get the real source file path with stats.moduleIdentifier.
  // e.g. moduleIdentifier is "builtin:react-refresh-loader!/Users/x/src/App.jsx"
  const regex = /(?:\!|^)([^!]+)$/;
  const fileName = stats.moduleIdentifier?.match(regex)?.at(-1) ?? '';
  return fileName
    ? // add default column add lines for linking
      `File: ${fileName}:1:1\n`
    : // fallback to moduleName if moduleIdentifier parse failed
      `File: ${stats.moduleName}\n`;
}

// Cleans up Rspack error messages.
function formatMessage(stats: StatsError | string) {
  let lines: string[] = [];
  let message: string;

  // Stats error object
  if (typeof stats === 'object') {
    const fileName = resolveFileName(stats);
    const mainMessage =
      typeof stats.formatted === 'string' ? stats.formatted : stats.message;
    const details = stats.details ? `\nDetails: ${stats.details}\n` : '';
    const stack = stats.stack ? `\n${stats.stack}` : '';

    message = `${fileName}${mainMessage}${details}${stack}`;
  } else {
    message = stats;
  }

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
  return message.trim();
}

export function formatStatsMessages(
  stats: Pick<StatsCompilation, 'errors' | 'warnings'>,
): {
  errors: string[];
  warnings: string[];
} {
  const formattedErrors = stats.errors?.map(formatMessage) || [];
  const formattedWarnings = stats.warnings?.map(formatMessage) || [];

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
