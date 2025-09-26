import type { Stats } from 'node:fs';
import * as path from 'node:path';
import { unescape as qsUnescape } from 'node:querystring';
import { parse } from 'node:url';
import { getPaths } from './getPaths';
import type { FilledContext } from './index';
import { memorize } from './memorize';

export type Extra = {
  stats?: Stats;
  errorCode?: number;
};

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
  const paths = getPaths(context) as {
    publicPath: string | undefined;
    outputPath: string;
  }[];

  let foundFilename: string | undefined;
  let urlObject: URL;

  try {
    urlObject = memoizedParse(url, false, true) as URL;
  } catch (_ignoreError) {
    return undefined;
  }

  for (const { publicPath, outputPath } of paths) {
    let filename: string | undefined;
    let publicPathObject: URL;

    try {
      publicPathObject = memoizedParse(
        publicPath !== 'auto' && publicPath ? publicPath : '/',
        false,
        true,
      ) as URL;
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
          context.outputFileSystem.statSync as (p: string) => Stats
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
            context.outputFileSystem.statSync as (p: string) => Stats
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
