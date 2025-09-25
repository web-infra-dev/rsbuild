import { type FilesMap, findFile } from '@e2e/helper';

export const getPolyfillContent = (files: FilesMap) => {
  let polyfillFileName: string | undefined;
  try {
    polyfillFileName = findFile(files, 'lib-polyfill.js.map');
  } catch {}
  return files[polyfillFileName ?? findFile(files, 'index.js.map')];
};
