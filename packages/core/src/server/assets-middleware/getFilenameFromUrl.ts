import type { Stats as FSStats } from 'node:fs';
import * as path from 'node:path';
import { unescape as qsUnescape } from 'node:querystring';
import { parse } from 'node:url';
import type { Stats } from '@rspack/core';
import type { FilledContext } from './index';
import { memorize } from './memorize';

export type Extra = {
  stats?: FSStats;
  errorCode?: number;
};

export function getOutputPaths(context: FilledContext): string[] {
  const { stats } = context;
  if (!stats) {
    return [];
  }

  const childStats: Stats[] = 'stats' in stats ? stats.stats : [stats];
  return childStats.map(
    ({ compilation }) => compilation.outputOptions.path || '',
  );
}

// TODO: type the cache options instead of using any for the second parameter
const memoizedParse = memorize(parse, undefined, (value: any) => {
  if (value.pathname) {
    value.pathname = decode(value.pathname);
  }

  return value;
});

const UP_PATH_REGEXP = /(?:^|[\\/])\.\.(?:[\\/]|$)/;

function decode(input: string): string {
  return qsUnescape(input);
}

export function getFilenameFromUrl(
  context: FilledContext,
  url: string,
  extra: Extra = {},
): string | undefined {
  let foundFilename: string | undefined;
  let urlObject: URL;

  try {
    urlObject = memoizedParse(url, false, true) as URL;
  } catch (_ignoreError) {
    return undefined;
  }

  for (const outputPath of getOutputPaths(context)) {
    let filename: string | undefined;
    let publicPathObject: URL;

    try {
      publicPathObject = memoizedParse('/', false, true) as URL;
    } catch (_ignoreError) {
      continue;
    }

    const { pathname } = urlObject;
    const { pathname: publicPathPathname } = publicPathObject;

    if (pathname?.startsWith(publicPathPathname)) {
      if (pathname.includes('\u0000')) {
        extra.errorCode = 400;
        return undefined;
      }

      if (UP_PATH_REGEXP.test(path.normalize(`./${pathname}`))) {
        extra.errorCode = 403;
        return undefined;
      }

      filename = path.join(
        outputPath,
        pathname.slice(publicPathPathname.length),
      );

      try {
        extra.stats = (
          context.outputFileSystem.statSync as (p: string) => FSStats
        )(filename);
      } catch (_ignoreError) {
        continue;
      }

      if (extra.stats.isFile()) {
        foundFilename = filename;
        break;
      }
      if (extra.stats.isDirectory()) {
        const indexValue = 'index.html';

        filename = path.join(filename, indexValue);

        try {
          extra.stats = (
            context.outputFileSystem.statSync as (p: string) => FSStats
          )(filename);
        } catch (__ignoreError) {
          continue;
        }

        if (extra.stats.isFile()) {
          foundFilename = filename;
          break;
        }
      }
    }
  }

  return foundFilename;
}
