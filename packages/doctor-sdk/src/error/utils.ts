import { Err, Logger } from '@rsbuild/doctor-types';

export function toLevel(level: keyof typeof Err.ErrorLevel) {
  return Err.ErrorLevel[level];
}

export function insertSpace(rawLines: string, line: number, width: number) {
  const lines = rawLines.split('\n');
  lines[line - 1] = Array(width).fill(' ').join('') + lines[line - 1];
  return lines.join('\n');
}

export function printErrors(
  { errors, warnings }: Err.DevToolErrorsData,
  logLevel: Logger.LogLevelName = 'Error',
) {
  const onlyError = logLevel === 'Error';

  if (logLevel === 'Silent') {
    return '';
  }

  if (
    (onlyError && errors.length === 0) ||
    (!onlyError && errors.length === 0 && warnings.length === 0)
  ) {
    return '';
  }

  const msgs: string[] = [];

  if (onlyError) {
    msgs.push(
      `Build failed with ${errors.length} error:`,
      ...errors.map((item) => item.toString()),
      '',
    );
  } else {
    const title =
      errors.length === 0
        ? `Build succuss with ${warnings.length} warning:`
        : `Build failed with ${errors.length} error, ${warnings.length} warning:`;

    msgs.push(
      title,
      ...errors.map((item) => item.toString()),
      ...warnings.map((item) => item.toString()),
      '',
    );
  }

  return msgs.join('\n\n');
}
