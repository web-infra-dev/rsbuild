import { Plugin, SDK } from '@rsbuild/doctor-types';

/**
 * Reverse decode the location (loc) information.
 * baseon
 * // TODO::
 * @link https://github.com/webpack/webpack/blob/main/lib/formatLocation.js#L30-L66
 */
export function getPositionByStatsLocation(
  loc: string,
): SDK.SourceRange | undefined {
  function formatPosition(loc: string): SDK.SourcePosition {
    const [line, column] = loc.split(':');
    return { line: Number(line), column: Number(column) };
  }

  if (loc.includes('-')) {
    const positionString = loc.split('-');
    const start = formatPosition(positionString[0]);
    const end = formatPosition(positionString[1]);

    return {
      start,
      end: Number.isNaN(end.column)
        ? {
            line: start.line,
            column: end.line,
          }
        : end,
    };
  }

  if (loc.includes(':')) {
    return {
      start: formatPosition(loc),
    };
  }

  if (loc.includes('[')) {
    const result = loc.match(/\[(\d+)\]/)!;

    return {
      start: {
        index: Number(result[1]),
      },
    };
  }
}

export function isWebpack5orRspack(
  compilation: Plugin.BaseCompilation,
): Boolean {
  return 'moduleGraph' in compilation && Boolean(compilation.moduleGraph);
}
