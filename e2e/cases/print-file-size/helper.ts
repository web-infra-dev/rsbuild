import { toPosixPath } from '@rstackjs/test-utils';

export function extractFileSizeLogs(logs: string[]) {
  const result: string[] = [];

  let isFileSizeLog = false;

  for (const log of logs) {
    const trimmed = log.trim();
    const isTableHeader = trimmed.startsWith('File (');
    const isTotalSize = trimmed.startsWith('Total');
    const isBuildTime = trimmed.startsWith('ready   built in');

    if (isTableHeader || isTotalSize) {
      isFileSizeLog = true;
    }
    if (isBuildTime) {
      isFileSizeLog = false;
    }
    if (isFileSizeLog) {
      // replace numbers and contenthash with placeholder
      // remove trailing spaces
      // replace Windows path sep with slash
      result.push(
        toPosixPath(
          log
            .replace(/\.[a-z0-9]{8,10}\./g, '.[[hash]].')
            .replace(/\d+\.\d+ kB/g, 'X.X kB')
            .replace(/\s+$/gm, ''),
        ),
      );
    }
    if (isTotalSize) {
      isFileSizeLog = false;
    }
  }

  return result.join('\n');
}
