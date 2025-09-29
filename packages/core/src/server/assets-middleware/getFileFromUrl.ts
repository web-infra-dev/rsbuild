import type { Stats as FSStats } from 'node:fs';
import path from 'node:path';
import { unescape as qsUnescape } from 'node:querystring';
import type { EnvironmentContext } from '../../types';
import type { OutputFileSystem } from './index';

const UP_PATH_REGEXP = /(?:^|[\\/])\.\.(?:[\\/]|$)/;

export function getFileFromUrl(
  url: string,
  outputFileSystem: OutputFileSystem,
  environments: Record<string, EnvironmentContext>,
): { filename: string; fsStats: FSStats } | { errorCode: number } | undefined {
  let pathname: string | undefined;

  try {
    const urlObject = new URL(url, 'http://localhost');
    if (urlObject.pathname) {
      pathname = qsUnescape(urlObject.pathname);
    }
  } catch {
    return;
  }

  if (!pathname) {
    return;
  }

  // Return early to prevent null byte injection attacks
  if (pathname.includes('\0')) {
    return { errorCode: 400 };
  }

  // Prevent path traversal attacks by checking for ".." patterns
  if (UP_PATH_REGEXP.test(path.normalize(`./${pathname}`))) {
    return { errorCode: 403 };
  }

  const distPaths = new Set(
    Object.values(environments).map((env) => env.distPath),
  );

  for (const distPath of distPaths) {
    let filename = path.join(distPath, pathname);
    let fsStats: FSStats | undefined;

    try {
      fsStats = outputFileSystem.statSync?.(filename);
    } catch {
      continue;
    }

    if (!fsStats) {
      continue;
    }

    if (fsStats.isFile()) {
      return { filename, fsStats };
    }

    if (fsStats.isDirectory()) {
      filename = path.join(filename, 'index.html');

      try {
        fsStats = outputFileSystem.statSync?.(filename);
      } catch {
        continue;
      }

      if (!fsStats) {
        continue;
      }

      if (fsStats.isFile()) {
        return { filename, fsStats };
      }
    }
  }
}
