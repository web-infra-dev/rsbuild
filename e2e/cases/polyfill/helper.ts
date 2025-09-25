import { type FilesMap, findFile } from '@e2e/helper';

const isPolyfillMap = (file: string) =>
  file.includes('lib-polyfill') && file.endsWith('.js.map');

export const getPolyfillContent = (files: FilesMap) => {
  let polyfillFileName: string | undefined;

  try {
    polyfillFileName = findFile(files, isPolyfillMap);
  } catch {
    polyfillFileName = undefined;
  }

  const indexFileName = findFile(
    files,
    (file) => file.includes('index') && file.endsWith('.js.map'),
  );

  return files[polyfillFileName ?? indexFileName];
};
