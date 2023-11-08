import { color } from './color';
import type { Stats, MultiStats } from './types';
import { formatWebpackMessages } from './formatWebpack';

export function formatStats(stats: Stats | MultiStats, showWarnings = true) {
  const statsData = stats.toJson({
    preset: 'errors-warnings',
  });

  const { errors, warnings } = formatWebpackMessages(statsData, color);

  if (errors.length) {
    const errorMsgs = `${errors.join('\n\n')}\n`;
    const isTerserError = errorMsgs.includes('from Terser');
    const title = color.bold(
      color.red(isTerserError ? `Minify error: ` : `Compile error: `),
    );
    const tip = color.yellow(
      isTerserError
        ? `Failed to minify with terser, check for syntax errors.`
        : 'Failed to compile, check the errors for troubleshooting.',
    );

    return {
      message: `${title}\n${tip}\n${errorMsgs}`,
      level: 'error',
    };
  }

  // always show warnings in tty mode
  if (warnings.length && (showWarnings || process.stdout.isTTY)) {
    const title = color.bold(color.yellow(`Compile Warning: \n`));
    return {
      message: `${title}${`${warnings.join('\n\n')}\n`}`,
      level: 'warning',
    };
  }

  return {};
}
