import type { StatsCompilation, StatsError } from '@rspack/core';

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
  return `File: ${stats.moduleName}\n`;
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
function formatMessage(stats: StatsError | string) {
  let lines: string[] = [];
  let message: string;

  // Stats error object
  if (typeof stats === 'object') {
    const fileName = resolveFileName(stats);
    const mainMessage = stats.message;
    const details = stats.details ? `\nDetails: ${stats.details}\n` : '';
    const stack = stats.stack ? `\n${stats.stack}` : '';

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
