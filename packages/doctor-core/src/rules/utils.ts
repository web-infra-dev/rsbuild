import { Linter } from '@rsbuild/doctor-types';

export function toSeverity(
  input: Linter.SeverityInput,
  defaultLevel: Linter.Severity,
): Linter.Severity {
  if (input === 'off') {
    return Linter.Severity.Ignore;
  }

  if (input === 'on') {
    return defaultLevel;
  }

  const key = `${input[0].toUpperCase()}${input.slice(
    1,
  )}` as Linter.SeverityString;
  return Linter.Severity[key] as Linter.Severity;
}

export function noop() {}
